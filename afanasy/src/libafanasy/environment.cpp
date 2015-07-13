#include "environment.h"

#ifdef WINNT
#include <windows.h>
#else
#include <pwd.h>
#include <unistd.h>
#endif

#include "../include/afanasy.h"
#include "../include/afjob.h"

#include "common/passwd.h"

#include "msg.h"

#define AFOUTPUT
#undef AFOUTPUT
#include "../include/macrooutput.h"

#define PRINT if(m_verbose_init)printf
#define QUIET if(!m_quiet_init)printf

using namespace af;

std::string Environment::digest_file;
std::string Environment::digest_realm;
std::map<std::string, std::string> Environment::digest_map;

bool Environment::perm_user_mod_his_priority = AFGENERAL::PERM_USER_MOD_HIS_PRIORITY;
bool Environment::perm_user_mod_job_priority = AFGENERAL::PERM_USER_MOD_JOB_PRIORITY;

int     Environment::priority =                        AFGENERAL::DEFAULT_PRIORITY;
int     Environment::maxrunningtasks =                 AFGENERAL::MAXRUNNINGTASKS;
int     Environment::filenamesizemax =                 AFGENERAL::FILENAMESIZEMAX;

int     Environment::serve_tasks_speed =               AFJOB::SERVE_TASKS_SPEED;
int     Environment::task_default_capacity =           AFJOB::TASK_DEFAULT_CAPACITY;
int     Environment::task_update_timeout =             AFJOB::TASK_UPDATE_TIMEOUT;
int     Environment::task_log_linesmax =               AFJOB::TASK_LOG_LINESMAX;

int     Environment::serverport =                      AFADDR::SERVER_PORT;
int     Environment::clientport =                      AFADDR::CLIENT_PORT;

int     Environment::watch_connectretries =            AFWATCH::CONNECTRETRIES;
int     Environment::watch_waitforconnected =          AFWATCH::WAITFORCONNECTED;
int     Environment::watch_waitforreadyread =          AFWATCH::WAITFORREADYREAD;
int     Environment::watch_waitforbyteswritten =       AFWATCH::WAITFORBYTESWRITTEN;
int     Environment::watch_refreshinterval =           AFWATCH::REFRESHINTERVAL;

int     Environment::render_default_capacity =         AFRENDER::DEFAULTCAPACITY;
int     Environment::render_default_maxtasks =         AFRENDER::DEFAULTMAXTASKS;
int     Environment::render_nice =                     AFRENDER::TASKPROCESSNICE;
int     Environment::render_update_sec =               AFRENDER::UPDATEPERIOD;
int     Environment::render_updatetaskperiod =         AFRENDER::UPDATETASKPERIOD;
int     Environment::render_zombietime =               AFRENDER::ZOMBIETIME;
int     Environment::render_connectretries =           AFRENDER::CONNECTRETRIES;
std::vector<std::string> Environment::render_windowsmustdie;
std::string Environment::cmd_shell =                   AFRENDER::CMD_SHELL;
 
std::string Environment::render_exec =                 AFRENDER::EXEC;
std::string Environment::render_cmd_reboot =           AFRENDER::CMD_REBOOT;
std::string Environment::render_cmd_shutdown =         AFRENDER::CMD_SHUTDOWN;
std::string Environment::render_cmd_wolsleep =         AFRENDER::CMD_WOLSLEEP;
std::string Environment::render_cmd_wolwake =          AFRENDER::CMD_WOLWAKE;
std::string Environment::render_networkif =            AFRENDER::NETWORK_IF;
std::string Environment::render_hddspace_path =        AFRENDER::HDDSPACE_PATH;
std::string Environment::render_iostat_device =        AFRENDER::IOSTAT_DEVICE;

std::string Environment::pswd_visor =                  AFUSER::PSWD_VISOR;
std::string Environment::pswd_god =                    AFUSER::PSWD_GOD;
int     Environment::errors_forgivetime =              AFUSER::ERRORS_FORGIVETIME;
int     Environment::errors_avoid_host =               AFUSER::ERRORS_AVOID_HOST;
int     Environment::task_error_retries =              AFUSER::TASK_ERROR_RETRIES;
int     Environment::task_errors_same_host =           AFUSER::TASK_ERRORS_SAME_HOST;

int         Environment::sysjob_tasklife =            AFJOB::SYSJOB_TASKLIFE;
int         Environment::sysjob_tasksmax =            AFJOB::SYSJOB_TASKSMAX;
std::string Environment::sysjob_wol_service =         AFJOB::SYSJOB_SERVICE;
std::string Environment::sysjob_postcmd_service =     AFJOB::SYSJOB_SERVICE;
std::string Environment::sysjob_events_service =      AFJOB::SYSJOB_EVENTS_SERVICE;

int     Environment::monitor_render_idle_bar_max =     AFMONITOR::RENDER_IDLE_BAR_MAX;
int     Environment::monitor_updateperiod =            AFMONITOR::UPDATEPERIOD;
int     Environment::monitor_connectretries =          AFMONITOR::CONNECTRETRIES;
int     Environment::monitor_waitforconnected =        AFMONITOR::WAITFORCONNECTED;
int     Environment::monitor_waitforreadyread =        AFMONITOR::WAITFORREADYREAD;
int     Environment::monitor_waitforbyteswritten =     AFMONITOR::WAITFORBYTESWRITTEN;
int     Environment::monitor_zombietime =              AFMONITOR::ZOMBIETIME;

int Environment::afnode_log_lines_max =              AFGENERAL::LOG_LINES_MAX;

int Environment::server_so_rcvtimeo_sec =          AFSERVER::SO_RCVTIMEO_SEC;
int Environment::server_so_sndtimeo_sec =          AFSERVER::SO_SNDTIMEO_SEC;
int Environment::server_so_msgtimeo_sec =          AFSERVER::SO_MSGTIMEO_SEC;

std::string Environment::db_conninfo =                     AFDATABASE::CONNINFO;
std::string Environment::db_stringquotes =                 AFDATABASE::STRINGQUOTES;
int Environment::db_stringnamelen =                AFDATABASE::STRINGNAMELEN;
int Environment::db_stringexprlen =                AFDATABASE::STRINGEXPRLEN;

std::string Environment::temp_dir = AFSERVER::TEMP_DIRECTORY;
std::string Environment::renders_dir;
std::string Environment::jobs_dir;
std::string Environment::users_dir;

std::string Environment::timeformat =                 AFGENERAL::TIME_FORMAT;
std::string Environment::servername =                 AFADDR::SERVER_NAME;
int Environment::ipv6_disable = 0;
std::string Environment::username;
std::string Environment::computername;
std::string Environment::hostname;
std::string Environment::cgrulocation;
std::string Environment::afroot;
std::string Environment::home;
std::string Environment::home_afanasy;
std::string Environment::http_serve_dir;

Address Environment::serveraddress;

bool Environment::god_mode       = false;
bool Environment::visor_mode     = false;
bool Environment::help_mode      = false;
bool Environment::demo_mode      = false;
bool Environment::m_valid        = false;
bool Environment::m_verbose_init = false;
bool Environment::m_quiet_init   = false;
bool Environment::m_verbose_mode = false;
bool Environment::m_solveservername = false;
bool Environment::m_server          = false;
std::vector<std::string> Environment::m_config_files;
std::string Environment::m_config_data;

Passwd * Environment::passwd = NULL;

std::vector<std::string> Environment::platform;
std::vector<std::string> Environment::cmdarguments;
std::vector<std::string> Environment::cmdarguments_usagearg;
std::vector<std::string> Environment::cmdarguments_usagehelp;
std::vector<std::string> Environment::previewcmds;
std::vector<std::string> Environment::rendercmds;
std::vector<std::string> Environment::rendercmds_admin;
std::vector<std::string> Environment::ip_trust;
std::vector<std::string> Environment::render_resclasses;

std::string Environment::version_revision;
std::string Environment::version_cgru;
std::string Environment::version_python;
std::string Environment::version_gcc;
std::string Environment::version_date;

void Environment::getVars( const JSON & i_obj)
{
	if( false == i_obj.IsObject())
	{
		AFERROR("Environment::getVars: Not an object.")
		return;
	}

	getVar( i_obj, servername,                        "af_servername"                        );
	getVar( i_obj, ipv6_disable,                      "af_ipv6_disable"                      );
	getVar( i_obj, ip_trust,                          "af_ip_trust"                          );
	getVar( i_obj, digest_file,                       "af_digest_file"                       );
	getVar( i_obj, digest_realm,                      "realm"                                );
	getVar( i_obj, serverport,                        "af_serverport"                        );
	getVar( i_obj, clientport,                        "af_clientport"                        );
	getVar( i_obj, http_serve_dir,                    "af_http_serve_dir"                    );

	getVar( i_obj, pswd_visor,                        "pswd_visor"                           );
	getVar( i_obj, pswd_god,                          "pswd_god"                             );

	getVar( i_obj, perm_user_mod_his_priority,        "af_perm_user_mod_his_priority"        );
	getVar( i_obj, perm_user_mod_job_priority,        "af_perm_user_mod_job_priority"        );

	getVar( i_obj, filenamesizemax,                   "filenamesizemax"                      );
	getVar( i_obj, timeformat,                        "timeformat"                           );
	getVar( i_obj, previewcmds,                       "previewcmds"                          );
	getVar( i_obj, cmd_shell,                         "cmd_shell"                            );

	getVar( i_obj, afnode_log_lines_max,              "af_node_log_lines_max"                );
	getVar( i_obj, priority,                          "af_priority"                          );
	getVar( i_obj, maxrunningtasks,                   "af_maxrunningtasks"                   );

	getVar( i_obj, temp_dir,                          "af_tempdirectory"                     );

	getVar( i_obj, db_conninfo,                       "af_db_conninfo"                       );
	getVar( i_obj, db_stringquotes,                   "af_db_stringquotes"                   );
	getVar( i_obj, db_stringnamelen,                  "af_db_stringnamelen"                  );
	getVar( i_obj, db_stringexprlen,                  "af_db_stringexprlen"                  );

	getVar( i_obj, server_so_rcvtimeo_sec,            "af_server_so_rcvtimeo_sec"            );
	getVar( i_obj, server_so_sndtimeo_sec,            "af_server_so_sndtimeo_sec"            );
	getVar( i_obj, server_so_msgtimeo_sec,            "af_server_so_msgtimeo_sec"            );

	getVar( i_obj, serve_tasks_speed,                 "af_serve_tasks_speed"                 );
	getVar( i_obj, task_default_capacity,             "af_task_default_capacity"             );
	getVar( i_obj, task_update_timeout,               "af_task_update_timeout"               );
	getVar( i_obj, task_log_linesmax,                 "af_task_log_linesmax"                 );

	getVar( i_obj, render_default_capacity,           "af_render_default_capacity"           );
	getVar( i_obj, render_default_maxtasks,           "af_render_default_maxtasks"           );
	getVar( i_obj, render_exec,                       "af_render_exec"                       );
	getVar( i_obj, render_cmd_reboot,                 "af_render_cmd_reboot"                 );
	getVar( i_obj, render_cmd_shutdown,               "af_render_cmd_shutdown"               );
	getVar( i_obj, render_cmd_wolsleep,               "af_render_cmd_wolsleep"               );
	getVar( i_obj, render_cmd_wolwake,                "af_render_cmd_wolwake"                );
	getVar( i_obj, render_hddspace_path,              "af_render_hddspace_path"              );
	getVar( i_obj, render_networkif,                  "af_render_networkif"                  );
	getVar( i_obj, render_iostat_device,              "af_render_iostat_device"              );
	getVar( i_obj, render_resclasses,                 "af_render_resclasses"                 );
	getVar( i_obj, render_nice,                       "af_render_nice"                       );
	getVar( i_obj, render_update_sec,                 "af_render_update_sec"                 );
	getVar( i_obj, render_updatetaskperiod,           "af_render_updatetaskperiod"           );
	getVar( i_obj, render_zombietime,                 "af_render_zombietime"                 );
	getVar( i_obj, render_connectretries,             "af_render_connectretries"             );
	getVar( i_obj, render_windowsmustdie,             "af_render_windowsmustdie"             );

	getVar( i_obj, rendercmds,                        "af_rendercmds"                        );
	getVar( i_obj, rendercmds_admin,                  "af_rendercmds_admin"                  );
	getVar( i_obj, watch_refreshinterval,             "af_watch_refreshinterval"             );
	getVar( i_obj, watch_connectretries,              "af_watch_connectretries"              );
	getVar( i_obj, watch_waitforconnected,            "af_watch_waitforconnected"            );
	getVar( i_obj, watch_waitforreadyread,            "af_watch_waitforreadyread"            );
	getVar( i_obj, watch_waitforbyteswritten,         "af_watch_waitforbyteswritten"         );

	getVar( i_obj, errors_forgivetime,                "af_errors_forgivetime"                );
	getVar( i_obj, errors_avoid_host,                 "af_errors_avoid_host"                 );
	getVar( i_obj, task_error_retries,                "af_task_error_retries"                );
	getVar( i_obj, task_errors_same_host,             "af_task_errors_same_host"             );

	getVar( i_obj, sysjob_tasklife,                   "af_sysjob_tasklife"                   );
	getVar( i_obj, sysjob_tasksmax,                   "af_sysjob_tasksmax"                   );
	getVar( i_obj, sysjob_postcmd_service,            "af_sysjob_postcmd_service"            );
	getVar( i_obj, sysjob_wol_service,                "af_sysjob_wol_service"                );
	getVar( i_obj, sysjob_events_service,             "af_sysjob_events_service"             );

	getVar( i_obj, monitor_render_idle_bar_max,       "af_monitor_render_idle_bar_max"       );
	getVar( i_obj, monitor_updateperiod,              "af_monitor_updateperiod"              );
	getVar( i_obj, monitor_zombietime,                "af_monitor_zombietime"                );
	getVar( i_obj, monitor_connectretries,            "af_monitor_connectretries"            );
	getVar( i_obj, monitor_waitforconnected,          "af_monitor_waitforconnected"          );
	getVar( i_obj, monitor_waitforreadyread,          "af_monitor_waitforreadyread"          );
	getVar( i_obj, monitor_waitforbyteswritten,       "af_monitor_waitforbyteswritten"       );
}

bool Environment::getVar( const JSON & i_obj, std::string & o_value, const char * i_name)
{
	if( af::jr_string( i_name, o_value, i_obj))
	{
		PRINT("\t%s = '%s'\n", i_name, o_value.c_str());
		return true;
	}
	return false;
}

bool Environment::getVar( const JSON & i_obj, int & o_value, const char * i_name)
{
	if( af::jr_int( i_name, o_value, i_obj))
	{
		PRINT("\t%s = %d\n", i_name, o_value);
		return true;
	}
	return false;
}

bool Environment::getVar( const JSON & i_obj, bool & o_value, const char * i_name)
{
	if( af::jr_bool( i_name, o_value, i_obj))
	{
		PRINT("\t%s = %d\n", i_name, o_value);
		return true;
	}
	return false;
}

bool Environment::getVar( const JSON & i_obj, std::vector<std::string> & o_value, const char * i_name)
{
	if( af::jr_stringvec( i_name, o_value, i_obj))
	{
		if( m_verbose_init )
		{
			printf("\t%s:\n", i_name);
			for( int i = 0; i < o_value.size(); i++)
				printf("\t\t%s\n", o_value[i].c_str());
		}
		return true;
	}
	return false;
}

Environment::Environment( uint32_t flags, int argc, char** argv )
{
	m_verbose_init = flags & Verbose;
	m_quiet_init = flags & Quiet;
	m_solveservername = flags & SolveServerName;
	m_server = flags & Server;
	if( m_quiet_init ) m_verbose_init = false;
//
// Init command arguments:
	initCommandArguments( argc, argv);

//
//############ afanasy root directory:
	afroot = getenv("AF_ROOT");
	if( afroot.size() == 0 )
	{
		 afroot = argv[0];
		 afroot = af::pathAbsolute( afroot);
		 afroot = af::pathUp( afroot);
		 afroot = af::pathUp( afroot);
		 QUIET("Setting Afanasy root to \"%s\"\n", afroot.c_str());
	}
	else
	{
		 PRINT("Afanasy root directory = '%s'\n", afroot.c_str());
	}
	if( af::pathIsFolder( afroot ) == false)
	{
		 AFERRAR("AF_ROOT directory = '%s' does not exists.", afroot.c_str())
		 return;
	}

//
//############ cgru root directory:
	cgrulocation = getenv("CGRU_LOCATION");
	if( cgrulocation.size() == 0 )
	{
		 cgrulocation = afroot;
		 cgrulocation = af::pathUp( cgrulocation);
		 std::string version_txt = cgrulocation + AFGENERAL::PATH_SEPARATOR + "version.txt";
		 if( false == af::pathFileExists( version_txt))
			   cgrulocation = af::pathUp( cgrulocation);
		 QUIET("Setting CRGU location to \"%s\"\n", cgrulocation.c_str());
	}
	else
	{
		 PRINT("CGRU_LOCATION = '%s'\n", cgrulocation.c_str());
	}
	if( af::pathIsFolder( cgrulocation) == false)
	{
		 AFERRAR("CGRU_LOCATION directory = '%s' does not exists.", cgrulocation.c_str())
		 return;
	}

//
// Afanasy python path:
	if( flags & AppendPythonPath)
	{
		std::string afpython = getenv("AF_PYTHON");
		if( afpython.size() == 0 )
		{
			std::string script = ""
			"import os\n"
			"import sys\n"
			"afpython = os.path.join( '" + afroot + "', 'python')\n"
			"if not afpython in sys.path:\n"
			"   print('PYTHONPATH: appending \"%s\"' % afpython)\n"
			"   sys.path.append( afpython)\n"
			;
			PyRun_SimpleString( script.c_str());
			 }
	}


//
//############ home directory:
	home = af::pathHome();
	PRINT("User home directory = '%s'\n", home.c_str());
#ifdef WINNT
	home_afanasy = home + AFGENERAL::PATH_SEPARATOR + "cgru";
#else
	home_afanasy = home + AFGENERAL::PATH_SEPARATOR + ".cgru";
#endif
	PRINT("Afanasy home directory = '%s'\n", home_afanasy.c_str());
	if( af::pathMakeDir( home_afanasy, af::VerboseOn ) == false)
	{
		AFERRAR("Can't make home directory '%s'", home_afanasy.c_str())
	}
//
//############ user name:
	getArgument("-username", username);
	if( username.empty()) username = getenv("AF_USERNAME");
	if( username.empty()) username = getenv("USER");
	if( username.empty()) username = getenv("USERNAME");
	if( username.empty())
	{
#ifdef WINNT
		 char acUserName[256];
		 DWORD nUserName = sizeof(acUserName);
		 if( GetUserName(acUserName, &nUserName)) username = acUserName;
#else
		 uid_t uid = geteuid ();
		 struct passwd * pw = getpwuid (uid);
		 if( pw ) username = pw->pw_name;
#endif
	}
	if( username.empty()) username = "unknown";

	// Convert to lowercase:
	std::transform( username.begin(), username.end(), username.begin(), ::tolower);
	// cut DOMAIN/
	size_t dpos = username.rfind('/');
	if( dpos == std::string::npos) dpos = username.rfind('\\');
	if( dpos != std::string::npos) username = username.substr( dpos + 1);
	std::transform( username.begin(), username.end(), username.begin(), ::tolower);
	PRINT("Afanasy user name = '%s'\n", username.c_str());

//
//############ Local host name:
	getArgument("-hostname", hostname);
	if( hostname.empty()) hostname = getenv("AF_HOSTNAME");
#ifdef WINNT
	computername = getenv("COMPUTERNAME");
	WSADATA wsaData;
	WORD wVersionRequested = MAKEWORD(2, 2);
	if( WSAStartup( wVersionRequested, &wsaData) != 0 )
	{
		 AFERROR("Environment::initAfterLoad(): WSAStartup failed.");
		 return;
	}
#else
	computername = getenv("HOSTNAME");
#endif
	if( computername.empty())
	{
		static const int buflen = 256;
		static char buffer[buflen];
#ifndef WINNT
		if( gethostname( buffer, buflen) != 0 )
#else
		DWORD win_buflen = buflen;
		if( GetComputerName( buffer, &win_buflen) != 0 )
#endif
		{
			AFERRPE("Can't get local host name")
			return;
		}
		computername = buffer;
	}
	if( hostname.empty()) hostname = computername;
	std::transform( hostname.begin(), hostname.end(), hostname.begin(), ::tolower);
	std::transform( computername.begin(), computername.end(), computername.begin(), ::tolower);

	PRINT("Local computer name = '%s'\n", computername.c_str());
	PRINT("Afanasy host name = '%s'\n", hostname.c_str());

//
//############ Platform: #############################
	{
	// OS Type:
	#ifdef WINNT
		platform.push_back("windows");
	#else
		platform.push_back("unix");
	#endif
	#ifdef MACOSX
		platform.push_back("macosx");
	#endif
	#ifdef LINUX
		platform.push_back("linux");
	#endif
	switch( sizeof(void*))
	{
		case 4: platform.push_back("32"); break;
		case 8: platform.push_back("64"); break;
	}
	}
	PRINT("Platform: '%s'\n", af::strJoin( platform).c_str());
//
//############ Versions: ########################

	// Date:
	version_date = std::string(__DATE__) + " " __TIME__;
	QUIET("Compilation date = '%s'\n", version_date.c_str());

	// CGRU:
	version_cgru = getenv("CGRU_VERSION");
	QUIET("CGRU version = '%s'\n", version_cgru.c_str());

	// Build Revision:
	#ifdef CGRU_REVISION
	#define STRINGIFY(x) #x
	#define EXPAND(x) STRINGIFY(x)
	version_revision = EXPAND(CGRU_REVISION);
	QUIET("Afanasy build revision = '%s'\n", version_revision.c_str());
	#endif

	// Python:
	version_python = af::itos(PY_MAJOR_VERSION) + "." + af::itos(PY_MINOR_VERSION) + "." + af::itos(PY_MICRO_VERSION);
	QUIET("Python version = '%s'\n", version_python.c_str());

	// GCC:
#ifdef __GNUC__
	version_gcc = af::itos(__GNUC__) + "." + af::itos(__GNUC_MINOR__) + "." + af::itos(__GNUC_PATCHLEVEL__);
	QUIET("GCC version = '%s'\n", version_gcc.c_str());
#endif

//###################################################

	load();
	m_valid = initAfterLoad();
}

Environment::~Environment()
{
	if( passwd != NULL) delete passwd;
	printUsage();
}

void Environment::load()
{
	m_config_files.clear();
	m_config_data.clear();

	m_config_data = "{\"cgru_config\":[";

	loadFile( cgrulocation + "/config_default.json");
	loadFile( home_afanasy + "/config.json");

	m_config_data += "{}]}";
/*
	m_verbose_init = false;
	filename = ( afroot + "/config_shadow.json");
	m_verbose_init=_verbose_init;
*/
}

void Environment::loadFile( const std::string & i_filename)
{
	// Check that file is not alreadt loaded, to prevent cyclic include
	for( int i = 0; i < m_config_files.size(); i++)
		if( m_config_files[i] == i_filename )
		{
			AFERRAR("Config file already included:\n%s", i_filename.c_str())
			return;
		}

	// Add file to store loaded:
	m_config_files.push_back( i_filename);

	if( false == pathFileExists( i_filename))
	{
		printf("Config file does not exist:\n%s\n", i_filename.c_str());
		return;
	}

	PRINT("Parsing config file '%s':\n", i_filename.c_str());

	int filesize = -1;
	char * buffer = fileRead( i_filename, &filesize);
	if( buffer == NULL )
		return;

	rapidjson::Document doc;
	char * data = jsonParseData( doc, buffer, filesize);
	if( data == NULL )
	{
		delete [] buffer;
		return;
	}

	// Add file data, it can be asked from server:
	m_config_data += std::string( buffer, filesize) + ",\n";

	const JSON & obj = doc["cgru_config"];
	if( false == obj.IsObject())
	{
		AFERRAR("Can't find document root \"cgru_config\": object:\n%s", i_filename.c_str())
	}
	else
	{
		getVars( obj);

		for( int i = 0; i < platform.size(); i++)
		{
			std::string obj_os_name = "OS_";
			obj_os_name += platform[i];
			const JSON & obj_os = obj[obj_os_name.c_str()];
			if( obj_os.IsObject())
			{
				PRINT("'%s' secific parameters:\n", obj_os_name.c_str());
				getVars( obj_os);
			}
		}

		std::vector<std::string> include;
		jr_stringvec("include", include, obj);
		for( int i = 0; i < include.size(); i++)
		{
			std::string filename = include[i];
			if( false == pathIsAbsolute( filename ))
				filename = pathUp( i_filename) + AFGENERAL::PATH_SEPARATOR + filename;
			loadFile( filename);
		}
	}

	delete [] data;
	delete [] buffer;

	return;
}

bool Environment::reload()
{
	m_verbose_init = true;
	load();
	m_valid = initAfterLoad();
	return m_valid;
}

bool Environment::checkKey( const char key) { return passwd->checkKey( key, visor_mode, god_mode); }

// Initialize environment after all variables are loaded (set to default values)
bool Environment::initAfterLoad()
{
	// Store folders:
	jobs_dir    = temp_dir + AFGENERAL::PATH_SEPARATOR +    AFJOB::DIRECTORY;
	renders_dir = temp_dir + AFGENERAL::PATH_SEPARATOR + AFRENDER::DIRECTORY;
	users_dir   = temp_dir + AFGENERAL::PATH_SEPARATOR +   AFUSER::DIRECTORY;

	// HTTP serve folder:
	if( http_serve_dir.empty()) 
		http_serve_dir = cgrulocation;

	// Server Accept IP Addresses Mask:
	if( false == Address::readIpMask( ip_trust, m_verbose_init))
	{
		return false;
	}

	// Digest authentication file read:
	{
	digest_file = getCGRULocation() + AFGENERAL::PATH_SEPARATOR + digest_file;
	std::string info;
	char * data = af::fileRead( digest_file, NULL, 0, &info);
	if( data )
	{
		std::vector<std::string> lines = af::strSplit( data,"\n");
		delete [] data;
		for( int l = 0; l < lines.size(); l++)
		{
			if( lines[l].size() == 0 ) continue;
			std::vector<std::string> words = af::strSplit(lines[l],":");
			if( words.size() != 3 )
			{
				AFERRAR("Invalid digest file:\n%s\n%s", digest_file.c_str(), lines[l].c_str())
				continue;
			}
			digest_map[words[0]] = words[2];
		}
		printf("Digest file loaded, authentication is enabled.\n");
	}
	else if( isVerboseMode())
	{
		if( info.size())
			printf("%s\n", info.c_str());
		printf("Digest not loaded, authentication is disabled.\n");
	}
	}

	// Check whether server address is configured:
	if(( servername == std::string(AFADDR::SERVER_NAME)) && ( isServer() != true ))
	{
		printf("WARNING: SERVER ADDRESS ID NOT CONFIGURED, USING %s\n", AFADDR::SERVER_NAME);
	}

	// Solve server name
	if( m_solveservername )
		 serveraddress = af::solveNetName( servername, serverport, AF_UNSPEC, m_verbose_init ? VerboseOn : VerboseOff);

	// VISOR and GOD passwords:
	if( passwd != NULL) delete passwd;
	passwd = new Passwd( pswd_visor, pswd_god);

	return true;
}

void Environment::initCommandArguments( int argc, char** argv)
{
	if(( argc == 0 ) || ( argv == NULL )) return;

	for( int i = 0; i < argc; i++)
	{
		cmdarguments.push_back(argv[i]);

		if( false == m_verbose_mode)
		if(( cmdarguments.back() == "-V"    ) ||
			( cmdarguments.back() == "--V"   ) ||
			( cmdarguments.back() == "--Verbose")
			)
		{
			printf("Verbose is on.\n");
			m_verbose_mode = true;
		}

		if( false == help_mode)
		if(( cmdarguments.back() == "-"     ) ||
			( cmdarguments.back() == "--"    ) ||
			( cmdarguments.back() == "-?"    ) ||
			( cmdarguments.back() == "?"     ) ||
			( cmdarguments.back() == "/?"    ) ||
			( cmdarguments.back() == "h"     ) ||
			( cmdarguments.back() == "-h"    ) ||
			( cmdarguments.back() == "--h"   ) ||
			( cmdarguments.back() == "help"  ) ||
			( cmdarguments.back() == "-help" ) ||
			( cmdarguments.back() == "--help")
			)
		{
			help_mode = true;
		}
	}
	addUsage("-username", "Override user name.");
	addUsage("-hostname", "Override host name.");
	addUsage("-h --help", "Display this help.");
	addUsage("-V --Verbose", "Verbose mode.");
}

bool Environment::hasArgument( const std::string & argument)
{
	for( std::vector<std::string>::const_iterator it = cmdarguments.begin(); it != cmdarguments.end(); it++)
		if( *it == argument )
			return true;
	return false;
}

bool Environment::getArgument( const std::string & argument, std::string & value)
{
	for( std::vector<std::string>::const_iterator it = cmdarguments.begin(); it != cmdarguments.end(); it++)
	{
		if( *it == argument )
		{
			// check for next argument:
			it++;
			if( it != cmdarguments.end()) value = *it;
			return true;
		}
	}
	return false;
}

const std::string Environment::getDigest( const std::string & i_user_name)
{
	std::string digest;
	std::map<std::string, std::string>::const_iterator it = digest_map.find( i_user_name);
	if( it != digest_map.end())
		digest = (*it).second;
	return digest;
}

void Environment::printUsage()
{
	if( false == help_mode ) return;
	if( cmdarguments_usagearg.empty() ) return;
	printf("USAGE: %s [arguments]\n", cmdarguments.front().c_str());
	std::vector<std::string>::const_iterator aIt = cmdarguments_usagearg.begin();
	std::vector<std::string>::const_iterator hIt = cmdarguments_usagehelp.begin();
	for( ; aIt != cmdarguments_usagearg.end(); aIt++, hIt++)
	{
		printf("   %s:\n      %s\n",
			(*aIt).c_str(),
			(*hIt).c_str()
			);
	}
}
