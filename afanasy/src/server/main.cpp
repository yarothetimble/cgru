#include <memory.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>

#include "../include/afanasy.h"

#include "../libafanasy/common/dlThread.h"

#include "../libafanasy/environment.h"
#include "../libafanasy/msgqueue.h"

#include "../libafsql/dbconnection.h"

#include "afcommon.h"
#include "jobcontainer.h"
#include "monitorcontainer.h"
#include "sysjob.h"
#include "rendercontainer.h"
#include "threadargs.h"
#include "usercontainer.h"


#define AFOUTPUT
#undef AFOUTPUT
#include "../include/macrooutput.h"

extern bool AFRunning;

// Thread functions:
void threadAcceptClient( void * i_arg );
void threadRunCycle( void * i_args);

#ifdef WINNT
#define STDERR_FILENO 2
#endif

//####################### signal handlers ####################################
void sig_int(int signum)
{
	char msg[] = "SIG INT\n";
	int u = ::write( STDERR_FILENO, msg, sizeof(msg)-1);
	AFRunning = false;
}
void sig_alrm(int signum)
{
	char msg [] = "SIG ALARM\n";
	int u = ::write( STDERR_FILENO, msg, sizeof(msg)-1);
}
void sig_pipe(int signum)
{
	char msg [] = "SIG PIPE\n";
	int u = ::write( STDERR_FILENO, msg, sizeof(msg)-1);
}

//######################################## main #########################################
int main(int argc, char *argv[])
{
	// Initialize environment:
	af::Environment ENV( af::Environment::Server, argc, argv);
	ENV.addUsage("-demo", "Disable tasks changing and new jobs.");

	// Initialize general library:
	if( af::init( af::InitFarm) == false) return 1;

	// Initialize store:
	afsql::init();

	// Environment aready printed usage and we can exit.
	if( ENV.isHelpMode()) return 0;

	// create directories if it is not exists
	if( af::pathMakePath( ENV.getTempDir(),    af::VerboseOn ) == false) return 1;
	if( af::pathMakeDir(  ENV.getJobsDir(),    af::VerboseOn ) == false) return 1;
	if( af::pathMakeDir(  ENV.getUsersDir(),   af::VerboseOn ) == false) return 1;
	if( af::pathMakeDir(  ENV.getRendersDir(), af::VerboseOn ) == false) return 1;

// Server for windows can be me more simple and not use signals at all.
// Windows is not a server platform, so it designed for individual tests or very small companies with easy load.
#ifndef _WIN32
// Interrupt signals catch.
// We need to catch interrupt signals to let threads to finish running function themselves.
// This needed mostly fot queues to let them to finish to process last item.
	struct sigaction actint;
	bzero( &actint, sizeof(actint));
	actint.sa_handler = sig_int;
	sigaction( SIGINT,  &actint, NULL);
	sigaction( SIGTERM, &actint, NULL);

// SIGPIPE signal catch.
// This is not an error for our application.
	struct sigaction actpipe;
	bzero( &actpipe, sizeof(actpipe));
	actpipe.sa_handler = sig_pipe;
	sigaction( SIGPIPE, &actpipe, NULL);

// SIGALRM signal catch and block.
// Special threads use alarm signal to unblock connect function.
// Other threads should ignore this signal.
	struct sigaction actalrm;
	bzero( &actalrm, sizeof(actalrm));
	actalrm.sa_handler = sig_alrm;
	sigaction( SIGALRM, &actalrm, NULL);
	sigset_t sigmask;
	sigemptyset( &sigmask);
	sigaddset( &sigmask, SIGALRM);
	if( sigprocmask( SIG_BLOCK, &sigmask, NULL) != 0) perror("sigprocmask:");
	if( pthread_sigmask( SIG_BLOCK, &sigmask, NULL) != 0) perror("pthread_sigmask:");
#endif

	// containers initialization
	JobContainer jobs;
	if( false == jobs.isInitialized()) return 1;

	UserContainer users;
	if( false == users.isInitialized()) return 1;

	RenderContainer renders;
	if( false == renders.isInitialized()) return 1;

	MonitorContainer monitors;
	if( false == monitors.isInitialized()) return 1;
	
	// Message Queue initialization, but without thread start.
	// Run cycle queue will read this messages itself.
	af::MsgQueue msgQueue("RunMsgQueue", af::AfQueue::e_no_thread);  
	if( false == msgQueue.isInitialized()) 
	  return 1;

	// Thread aruguments.
	ThreadArgs threadArgs;
	threadArgs.jobs      = &jobs;
	threadArgs.renders   = &renders;
	threadArgs.users     = &users;
	threadArgs.monitors  = &monitors;
	threadArgs.msgQueue  = &msgQueue;

	/*
	  Creating the afcommon object will actually create many message queues
	  that will spawn threads. Have a look in the implementation of AfCommon.
	*/
	AFCommon afcommon( &threadArgs );

	// Update SQL tables:
	afsql::DBConnection afdb_upTables("AFDB_upTables");
	afdb_upTables.DBOpen();
	if( afdb_upTables.isOpen())
	{
		afsql::UpdateTables( &afdb_upTables);
		afdb_upTables.DBClose();
	}

	//
	// Get Renders from store:
	//
	{
	printf("Getting renders from store...\n");

	std::vector<std::string> folders = AFCommon::getStoredFolders( ENV.getRendersDir());
	printf("%d renders found.\n", (int)folders.size());

	for( int i = 0; i < folders.size(); i++)
	{
		RenderAf * render = new RenderAf( folders[i]);
		if( render->isStoredOk() != true )
		{
			af::removeDir( render->getStoreDir());
			delete render;
			continue;
		}
		renders.addRender( render);
	}
	printf("%d renders registered.\n", renders.getCount());
	}

	//
	// Get Users from store:
	//
	{
	printf("Getting users from store...\n");

	std::vector<std::string> folders = AFCommon::getStoredFolders( ENV.getUsersDir());
	printf("%d users found.\n", (int)folders.size());

	for( int i = 0; i < folders.size(); i++)
	{
		UserAf * user = new UserAf( folders[i]);
		if( user->isStoredOk() != true )
		{
			af::removeDir( user->getStoreDir());
			delete user;
			continue;
		}
		if( users.addUser( user) == 0 )
			delete user;
	}
	printf("%d users registered from store.\n", users.getCount());
	}
	//
	// Get Jobs from store:
	//
	bool hasSystemJob = false;
	{
	printf("Getting jobs from store...\n");

	std::vector<std::string> folders = AFCommon::getStoredFolders( ENV.getJobsDir());
	std::string sysjob_folder = AFCommon::getStoreDir( ENV.getJobsDir(), AFJOB::SYSJOB_ID, AFJOB::SYSJOB_NAME);

	printf("%d jobs found.\n", (int)folders.size());
	for( int i = 0; i < folders.size(); i++)
	{
		JobAf * job = NULL;

		if( folders[i] == sysjob_folder)
			job = new SysJob( folders[i]);
		else
			job = new JobAf( folders[i]);

		if( job->isValidConstructed())
		{
			if( job->getId() == AFJOB::SYSJOB_ID )
			{
				SysJob * sysjob = (SysJob*)job;
				if( sysjob->initSystem() )
				{
					hasSystemJob = true;
				}
				else
				{
					printf("System job retrieved from store is obsolete. Deleting it...\n");
					delete job;
					continue;
				}
			}
			jobs.job_register( job, &users, NULL);
		}
		else
		{
			af::removeDir( job->getStoreDir());
			delete job;
		}
	}
	printf("%d jobs registered from store.\n", jobs.getCount());
	}

	// Disable new commands and editing:
	if( af::Environment::hasArgument("-demo"))
	{
		printf("Demo mode, no new commands.\n");
		af::Environment::setDemoMode();
	}

//
// Create system maintenance job if it was not in store:
	if( hasSystemJob == false )
	{
		SysJob* job = new SysJob();
		jobs.job_register( job, &users, NULL);
	}

	/*
	  Start the thread that is responsible of listening to the port
	  for incoming connections.
	*/
	DlThread ServerAccept;
	ServerAccept.Start( &threadAcceptClient, &threadArgs);

	// Run cycle thread.
	// All 'brains' are there.
	DlThread RunCycleThread;
	RunCycleThread.Start( &threadRunCycle, &threadArgs);

	/* Do nothing since everything is done in our threads. */
	while( AFRunning )
	{
		DlThread::Self()->Sleep( 1 );
	}

	AFINFO("afanasy::main: Waiting child threads.")
	//alarm(1);
	/*FIXME: Why we don`t need to join accent thread? */
	//ServerAccept.Cancel();
	//ServerAccept.Join();

	AFINFO("afanasy::main: Waiting Run.")
	// No need to chanel run cycle thread as
	// every new cycle it checks running external valiable
	RunCycleThread.Join();

	af::destroy();

	return 0;
}
