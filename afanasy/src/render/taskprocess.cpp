#include "taskprocess.h"

#include <fcntl.h>
#include <sys/types.h>

#ifdef WINNT
#include <windows.h>
#include <Winsock2.h>
#define fclose CloseHandle
#define WEXITSTATUS
#else
#include <signal.h>
#include <sys/ioctl.h>
#include <sys/wait.h>
extern void (*fp_setupChildProcess)( void);
#endif

#include "../include/afanasy.h"

#include "../libafanasy/environment.h"
#include "../libafanasy/msgclasses/mclistenaddress.h"
#include "../libafanasy/msgclasses/mctaskoutput.h"
#include "../libafanasy/msgclasses/mctaskup.h"

#include "renderhost.h"
#include "parserhost.h"

#define AFOUTPUT
#undef AFOUTPUT
#include "../include/macrooutput.h"

#ifndef WINNT
// Setup task process for UNIX-like OSes:
// This function is called by child process just after fork() and before exec()
void setupChildProcess( void)
{
//printf("This is child process!\n");
#ifdef MACOSX
	if( setpgrp() == -1 ) AFERRPE("setpgrp")
#endif
	if( setsid() == -1) AFERRPE("setsid")
	int nicenew = nice( af::Environment::getRenderNice());
	if( nicenew == -1) AFERRPE("nice")
}

// Taken from:
// http://www.kegel.com/dkftpbench/nonblocking.html
int setNonblocking(int fd)
{
	int flags;
	/* If they have O_NONBLOCK, use the Posix way to do it */
#if defined(O_NONBLOCK)
	/* Fixme: O_NONBLOCK is defined but broken on SunOS 4.1.x and AIX 3.2.5. */
	if (-1 == (flags = fcntl(fd, F_GETFL, 0)))
		flags = 0;
	return fcntl(fd, F_SETFL, flags | O_NONBLOCK);
#else
	/* Otherwise, use the old way of doing it */
	flags = 1;
	return ioctl(fd, FIOBIO, &flags);
#endif
}
#endif

long long TaskProcess::counter = 0;

TaskProcess::TaskProcess( af::TaskExec * i_taskExec):
	m_taskexec( i_taskExec),
	m_parser( NULL),
	m_update_status( af::TaskExec::UPPercent),
	m_stop_time( 0),
	m_pid(0),
	m_doing_post( false),
	m_zombie( false),
	m_dead_cycle(0)
{
	m_store_dir = af::Environment::getTempDir() + AFGENERAL::PATH_SEPARATOR + "tasks" + AFGENERAL::PATH_SEPARATOR;
	m_store_dir += af::itos( m_taskexec->getJobId());
	m_store_dir += '.' + af::itos( m_taskexec->getBlockNum());
	m_store_dir += '.' + af::itos( m_taskexec->getTaskNum());
	m_store_dir += '_' + af::itos( ++counter);

	if( af::pathIsFolder( m_store_dir))
		af::removeDir( m_store_dir);
	af::pathMakePath( m_store_dir);

	m_service = new af::Service( m_taskexec, m_store_dir);
	m_cmd  = m_service->getCommand();
	m_wdir = m_service->getWDir();

	m_parser = new ParserHost( m_service);

	// Process task working directory:
	if( m_wdir.size())
	{
#ifdef WINNT
		if( m_wdir.find("\\\\") == 0)
		{
			AFERRAR("Working directory starts with '\\':\n%s\nUNC path can't be current.", m_wdir.c_str())
			m_wdir.clear();
		}
#endif
		if( false == af::pathIsFolder( m_wdir))
		{
			printf("WARNING: Working directory does not exist:\n%s\n", m_wdir.c_str());
			m_wdir.clear();
		}
	}

	if( m_wdir.empty())
		m_wdir = af::Environment::getTempDir();

	if( af::Environment::isVerboseMode()) printf("%s\n", m_cmd.c_str());

	launchCommand();

	if( m_pid == 0 )
	{
		m_update_status = af::TaskExec::UPFailedToStart;
		sendTaskSate();
		return;
	}
}

void TaskProcess::launchCommand()
{
//printf("TaskProcess::launchCommand: command:\n%s\n", m_cmd.c_str());

	// Close handles remained from main process:
	if( m_doing_post )
		closeHandles();

	#ifdef WINNT
	DWORD priority = NORMAL_PRIORITY_CLASS;
	int nice = af::Environment::getRenderNice();
	if( nice >   0 ) priority = BELOW_NORMAL_PRIORITY_CLASS;
	if( nice >  10 ) priority = IDLE_PRIORITY_CLASS;
	if( nice <   0 ) priority = ABOVE_NORMAL_PRIORITY_CLASS;
	if( nice < -10 ) priority = HIGH_PRIORITY_CLASS;

	// For MSWIN we need to CREATE_SUSPENDED to attach process to a job before it can spawn any child:
	if( RenderHost::noOutputRedirection())
	{
		// Test a command w/o output redirection:
	    if( af::launchProgram( &m_pinfo, m_cmd, m_wdir, 0, 0, 0,
			CREATE_SUSPENDED | priority ))
			m_pid = m_pinfo.dwProcessId;
	}
	else
	{
	    if( af::launchProgram( &m_pinfo, m_cmd, m_wdir, &m_io_input, &m_io_output, &m_io_outerr,
			CREATE_SUSPENDED | priority ))
			m_pid = m_pinfo.dwProcessId;
	}
	#else
	// For UNIX we can ask child prcocess to call a function to setup after fork()
	fp_setupChildProcess = setupChildProcess;
	if( RenderHost::noOutputRedirection())
		m_pid = af::launchProgram( m_cmd, m_wdir, 0, 0, 0);
	else
		m_pid = af::launchProgram( m_cmd, m_wdir, &m_io_input, &m_io_output, &m_io_outerr);
	#endif

	if( m_pid <= 0 )
	{
		AFERROR("Failed to start a process")
		m_pid = 0;
		return;
	}

	#ifdef WINNT
	// On windows we attach process to a job to close all spawned childs:
	m_hjob = CreateJobObject( NULL, NULL);
	JOBOBJECT_EXTENDED_LIMIT_INFORMATION jeli = { 0 };
	jeli.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
	if( SetInformationJobObject( m_hjob, JobObjectExtendedLimitInformation, &jeli, sizeof( jeli ) ) == 0)
		AFERROR("SetInformationJobObject failed.\n");
	if( AssignProcessToJobObject( m_hjob, m_pinfo.hProcess) == false)
		AFERRAR("TaskProcess: AssignProcessToJobObject failed with code = %d.", GetLastError())
	// Ppecess is CREATE_SUSPENDED so we need to resume it:
	if( ResumeThread( m_pinfo.hThread) == -1)
		AFERRAR("TaskProcess: ResumeThread failed with code = %d.", GetLastError())

	printf("\nStarted PID=%d: ", m_pid);

	#else
	// On UNIX we set buffers and non-blocking:
	if( false == RenderHost::noOutputRedirection())
	{
		setbuf( m_io_output, m_filebuffer_out);
		setbuf( m_io_outerr, m_filebuffer_err);
		setNonblocking( fileno( m_io_input));
		setNonblocking( fileno( m_io_output));
		setNonblocking( fileno( m_io_outerr));
	}

	printf("\nStarted PID=%d SID=%d(%d) GID=%d(%d): ", m_pid, getsid(m_pid), setsid(), getpgid(m_pid), getpgrp());

	#endif

	if( false == m_doing_post )
		m_taskexec->v_stdOut( af::Environment::isVerboseMode());
	else
		printf("POST: %s\n", m_cmd.c_str());
}

TaskProcess::~TaskProcess()
{
//printf(" ~ TaskProcess(): m_pid = %d, Z = %s, m_stop_time = %llu\n", m_pid, m_zombie ? "TRUE":"FALSE", m_stop_time);
	m_update_status = 0;

	killProcess();
	closeHandles();

#ifdef AFOUTPUT
	printf(" ~ TaskProcess(): ");
	m_taskexec->stdOut();
#endif

	delete m_taskexec;
	delete m_service;
	delete m_parser;

	af::removeDir( m_store_dir);
}

void TaskProcess::closeHandles()
{
	if( false == RenderHost::noOutputRedirection())
	{
		fclose( m_io_input);
		fclose( m_io_output);
		fclose( m_io_outerr);
	}
}

void TaskProcess::refresh()
{
	// If task was asked to stop
	if( m_stop_time )
	{
		// If it is not running any more
		if( m_pid == 0 )
		{
			// Set zombie to let render to delete this class instance
			m_zombie = true;
		}
		else if( time( NULL) - m_stop_time > AFRENDER::TERMINATEWAITKILL )
		{
			// Task was asket to stop but did not stopped for more than AFRENDER::TERMINATEWAITKILL seconds
			printf("Warining: Task stopping time > %d seconds.\n", AFRENDER::TERMINATEWAITKILL);
			// Kill process in this case
			killProcess();
		}
	}

	// Task is finished
	if( m_pid == 0 )
	{
		if( m_dead_cycle > 0 )
		{
	        // This class instance is not needed any more, but still exists due some error
		    printf("Dead Cycle #%d: ", m_dead_cycle); m_taskexec->v_stdOut();
		}

		// This is a first dead cycle.
		m_dead_cycle ++;
		// And in normal case it should be the last one.

		// Continue sending task state to server, may be some network connection error.
		if(( m_dead_cycle % 10 ) == 0 )
		{
			// But only every 10 cycles, as network may be very busy (almost down in this case).
			sendTaskSate();
		}
		return;
	}

	int status;
	pid_t pid = 0;
#ifdef WINNT
	DWORD result = WaitForSingleObject( m_pinfo.hProcess, 0);
	if ( result == WAIT_OBJECT_0)
	{
		GetExitCodeProcess( m_pinfo.hProcess, &result);
		status = result;
		pid = m_pid;
	}
	else if ( result == WAIT_FAILED )
	{
		pid = -1;
	}
#else
	pid = waitpid( m_pid, &status, WNOHANG);
#endif
//printf("TaskProcess::refresh(): pid=%d, m_pid=%d\n", pid, m_pid);

	if( pid == 0 )
	{
		// Task is not finished
		readProcess("RUN",/* i_read_empty = */ false);
	}
	else if( pid == m_pid )
	{
		// Task is finished
		processFinished( status);
	}
	else if( pid == -1 )
	{
		AFERRPE("TaskProcess::refresh(): waitpid: ")
	}

	sendTaskSate();
}

void TaskProcess::close()
{
// Server asked render to close a task
// So it is not needed for server any more
//printf("TaskProcess::close(): m_pid = %d, Z = %s, m_stop_time = %llu\n", m_pid, m_zombie ? "TRUE":"FALSE", m_stop_time);

	// Zero value means that message for server is not needed
   	m_update_status = 0;

	// If task was asked to stop
	if( m_stop_time )
	{
		// It can be parser case, error or success, no matter here
		// Task should be set to zombie only after its process finish

		return;
	}

	// Set zombie to let render to delete this class instance
	m_zombie = true;
}

void TaskProcess::readProcess( const std::string & i_mode, bool i_read_empty)
{
	if( RenderHost::noOutputRedirection()) return;

	std::string output;

	int readsize = readPipe( m_io_output);
	if( readsize > 0 )
		output = std::string( m_readbuffer, readsize);

	readsize = readPipe( m_io_outerr);
	if( readsize > 0 )
		output += std::string( m_readbuffer, readsize);

	// Skip parsing empty string ( it not forced )
	if(( i_read_empty == false ) && ( output.size() == 0 ))
		return;

	m_parser->read( i_mode, output);

	// Send data to listening sockets, it not empty
	if( output.size() && m_taskexec->getListenAddressesNum())
	{
		af::MCTaskOutput mctaskoutput( RenderHost::getName(),
			m_taskexec->getJobId(),
			m_taskexec->getBlockNum(),
			m_taskexec->getTaskNum(),
			output.size(), output.data());
		af::Msg * msg = new af::Msg( af::Msg::TTaskOutput, &mctaskoutput);
		msg->setAddresses( *m_taskexec->getListenAddresses());
		RenderHost::dispatchMessage( msg);
	}

	if( m_parser->hasWarning() && ( m_update_status != af::TaskExec::UPWarning               ) &&
	                              ( m_update_status != af::TaskExec::UPFinishedParserError   ) &&
	                              ( m_update_status != af::TaskExec::UPFinishedParserSuccess ))
	{
		printf("WARNING: Parser notification.\n");
		m_update_status = af::TaskExec::UPWarning;
	}

	// if task is not in "stopping" state
	if( m_stop_time == 0 )
	{
		// ckeck parser reasons to force to stop a task
	    if( m_parser->hasError())
	    {
	        printf("Error: Parser bad result. Stopping task.\n");
	        m_update_status = af::TaskExec::UPFinishedParserError;
	        stop();
	    }
	    if( m_parser->isFinishedSuccess())
	    {
	        printf("Warning: Parser finished success. Stopping task.\n");
	        m_update_status = af::TaskExec::UPFinishedParserSuccess;
	        stop();
	    }
	}
}

void TaskProcess::sendTaskSate()
{
	if( m_update_status == 0 )
	{
		// Zero value means that message for server is not needed
		return;
	}

	int    type = af::Msg::TTaskUpdatePercent;
	bool   toRecieve = false;
	char * stdout_data = NULL;
	int    stdout_size = 0;

	if(( m_update_status != af::TaskExec::UPPercent ) &&
		( m_update_status != af::TaskExec::UPWarning ))
	{
		type = af::Msg::TTaskUpdateState;
		toRecieve = true;
		stdout_data = m_parser->getData( &stdout_size);
	}

	int percent        = 0;
	int frame          = 0;
	int percentframe   = 0;
	std::string activity = "";

	percent        = m_parser->getPercent();
	frame          = m_parser->getFrame();
	percentframe   = m_parser->getPercentFrame();
	activity       = m_parser->getActivity();

	af::MCTaskUp taskup(
		RenderHost::getId(),

		m_taskexec->getJobId(),
		m_taskexec->getBlockNum(),
		m_taskexec->getTaskNum(),
		m_taskexec->getNumber(),

		m_update_status,
		percent,
		frame,
		percentframe,
		activity,

		stdout_size,
		stdout_data);

	collectFiles( taskup);
	taskup.setParsedFiles( m_service->getParsedFiles());

	af::Msg * msg = new af::Msg( type, &taskup);
	if( toRecieve) msg->setReceiving();

//    printf("TaskProcess::sendTaskSate:\n");msg->stdOut();printf("\n");

	RenderHost::dispatchMessage( msg);
}

void TaskProcess::processFinished( int i_exitCode)
{
printf("Finished PID=%d: Exit Code=%d Status=%d %s\n", m_pid, i_exitCode, WEXITSTATUS( i_exitCode), m_stop_time ? "(stopped)":"");

	// Zero m_pid means that task is not running any more
	m_pid = 0;

#ifdef WINNT
	if( m_stop_time != 0 )
		printf("Task terminated/killed\n");
#else
	if(( m_stop_time != 0 ) || WIFSIGNALED( i_exitCode))
		printf("Task terminated/killed by signal: '%s'.\n", strsignal( WTERMSIG( i_exitCode)));
#endif

	// If server update not needed
	if( m_update_status == 0 )
	{
		// We do not need to read process output
		return;
	}

	// Read process last output
	// Force to read even empty output to let user to perform finalizing actions.
	readProcess( af::itos( i_exitCode) + ':' + af::itos( m_stop_time),/* i_read_empty = */ true);

	bool success = m_service->checkExitStatus( WEXITSTATUS( i_exitCode));

	if(( success != true ) || ( m_stop_time != 0 ))
	{
		if( m_doing_post )
			m_update_status = af::TaskExec::UPFinishedFailedPost;
		else
			m_update_status = af::TaskExec::UPFinishedError;
#ifdef WINNT
		if( m_stop_time != 0 )
#else
		if(( m_stop_time != 0 ) || WIFSIGNALED( i_exitCode))
#endif
		{
			if(( m_update_status != af::TaskExec::UPFinishedParserError   ) &&
			   ( m_update_status != af::TaskExec::UPFinishedParserSuccess ))
			     m_update_status  = af::TaskExec::UPFinishedKilled;
		}
	}
	else if( m_parser->isBadResult())
	{
		m_update_status = af::TaskExec::UPFinishedParserBadResult;
		AFINFO("Bad result from parser.")
	}
	else
	{
		if( false == m_doing_post )
		{
			m_post_cmds = m_service->doPost();
			m_doing_post = true;
		}

		if( m_doing_post && m_post_cmds.size())
		{
			m_cmd = m_post_cmds.front();
//printf("POST:\n%s\n", af::strJoin( m_post_cmds, "\n").c_str());
			m_post_cmds.erase( m_post_cmds.begin());
			launchCommand();
		}
		else
			m_update_status = af::TaskExec::UPFinishedSuccess;
	}
}

void TaskProcess::stop()
{
	// If time was not asked to stop before
	if( m_stop_time == 0 )
	{
		// Store the time when task was asked to be stopped (was asked first time)
		m_stop_time = time(NULL);
	}

	// Return if task is not running
	if( m_pid == 0 )
	{
		return;
	}

	// Trying to terminate() first, and only if no response after some time, then perform kill()
#ifdef UNIX
	killpg( getpgid( m_pid), SIGTERM);
#else
	CloseHandle( m_hjob );
#endif
}

void TaskProcess::killProcess()
{
	if( m_pid == 0 ) return;
	printf("KILLING NOT TERMINATED TASK.\n");
#ifdef UNIX
	killpg( getpgid( m_pid), SIGKILL);
#else
	CloseHandle( m_hjob );
#endif
}

void TaskProcess::getOutput( af::Msg * o_msg) const
{
	int size;
	char *data = m_parser->getData( &size);
	if( size > 0)
	{
		o_msg->setData( size, data);
	}
	else
	{
		o_msg->setString("Render: Silence...");
	}
}

#ifdef WINNT
int TaskProcess::readPipe( HANDLE i_handle )
{
	// Get how much data is available:
	DWORD bytesAvail;
	if ( false == PeekNamedPipe( i_handle, NULL, 0, NULL, &bytesAvail, NULL))
	{
		DWORD lastError = GetLastError();
		if( lastError != ERROR_BROKEN_PIPE )
			AFERRAR("TaskProcess::readPipe: PeekNamedPipe() failure with code = %d.", GetLastError())
		return 0;
	}

	if ( bytesAvail <= 0 )
		return 0;

	// Read data:
	DWORD readsize = 0;
	if( false == ReadFile( i_handle, m_readbuffer, bytesAvail, &readsize, NULL))
	{
		AFERRAR("TaskProcess::readPipe: ReadFile() failure with code = %d.", GetLastError())
		return 0;
	}

	return readsize;
}
#else
int TaskProcess::readPipe( FILE * i_file )
{
	int readsize = fread( m_readbuffer, 1, m_readbuffer_size, i_file );
	if( readsize <= 0 )
	{
		if( errno == EAGAIN )
		{
			readsize = fread( m_readbuffer, 1, m_readbuffer_size, i_file );
			if( readsize <= 0 )
			    return 0;
		}
		else
			return 0;
	}
	return readsize;
}
#endif

void TaskProcess::collectFiles( af::MCTaskUp & i_task_up)
{
	std::vector<std::string> list = af::getFilesList( m_store_dir);
	for( int i = 0; i < list.size(); i++)
	{
		bool already_collected = false;
		for( int j = 0; j < m_collected_files.size(); j++)
		{
			if( m_collected_files[j] == list[i] )
			{
				//printf("File '%s' already collected\n", list[i].c_str());
				already_collected = true;
				break;
			}
		}
		if( already_collected ) continue;
		m_collected_files.push_back( list[i]);

		std::string path = m_store_dir + AFGENERAL::PATH_SEPARATOR + list[i];
		#ifdef WINNT
		path = af::strReplace( path, '/','\\');
		#endif
		int size;
		char * data = af::fileRead( path, &size, 100000);
		if( data == NULL ) continue;
		if( size >= 100000 )
		{
			delete data;
			continue;
		}
		i_task_up.addFile( list[i], data, size);
	}
}

