#pragma once

#include "../libafanasy/environment.h"
#include "../libafanasy/msgqueue.h"
#include "../libafanasy/name_af.h"

#include "../libafsql/name_afsql.h"

#include "filequeue.h"
#include "dbqueue.h"
#include "logqueue.h"

struct ThreadArgs;

/*
	From what I understand this is just a holder for global
	variables (aghiles).
*/
class AFCommon
{
public:
	AFCommon( ThreadArgs * i_threadArgs);
	~AFCommon();

	static void executeCmd( const std::string & cmd); ///< Execute command.

/// Save string list, perform log file rotation;
	static void saveLog( const std::list<std::string> & log, const std::string & dirname, const std::string & filename);

	static bool writeFile( const char * data, const int length, const std::string & filename); ///< Write a file
	inline static bool writeFile( const std::string & i_str, const std::string & i_file_name)
		{ return writeFile( i_str.c_str(), i_str.size(), i_file_name);}
	inline static bool writeFile( const std::ostringstream & i_str, const std::string & i_file_name)
		{ std::string str = i_str.str(); return writeFile( str.c_str(), str.size(), i_file_name);}

	static const std::string getStoreDir( const std::string & i_root, int i_id, const std::string & i_name);
	inline static const std::string getStoreDir( const std::string & i_root, const af::Node & i_node)
		{ return getStoreDir( i_root, i_node.getId(), i_node.getName());}
	inline static const std::string getStoreDirJob( const af::Node & i_node)
		{ return getStoreDir( af::Environment::getJobsDir(), i_node);}
	inline static const std::string getStoreDirUser( const af::Node & i_node)
		{ return getStoreDir( af::Environment::getUsersDir(), i_node);}
	inline static const std::string getStoreDirRender( const af::Node & i_node)
		{ return getStoreDir( af::Environment::getRendersDir(), i_node);}

	static const std::vector<std::string> getStoredFolders( const std::string & i_root);

//   static void catchDetached(); ///< Try to wait any child ( to prevent Zombie processes).

//	inline static void QueueMsgMonitor( af::Msg * i_msg) { MsgDispatchQueue_M->pushMsg( i_msg);   }
//	inline static void QueueMsgTalk(    af::Msg * i_msg) { MsgDispatchQueue_T->pushMsg( i_msg);   }

	inline static void QueueFileWrite( FileData * i_filedata)      { FileWriteQueue->pushFile( i_filedata); }
	inline static void QueueNodeCleanUp( const AfNodeSrv * i_node) { FileWriteQueue->pushNode( i_node);     }

	inline static bool QueueLog(        const std::string & log) { if( OutputLogQueue) return OutputLogQueue->pushLog( log, LogData::Info  ); else return false;}
	inline static bool QueueLogError(   const std::string & log) { if( OutputLogQueue) return OutputLogQueue->pushLog( log, LogData::Error ); else return false;}
	inline static bool QueueLogErrno(   const std::string & log) { if( OutputLogQueue) return OutputLogQueue->pushLog( log, LogData::Errno ); else return false;}

	inline static void DBAddJob( const af::Job * i_job) { if( ms_DBQueue ) ms_DBQueue->addJob( i_job );}
	inline static void DBAddTask(
		const af::TaskExec * i_exec,
		const af::TaskProgress * i_progress,
		const af::Job * i_job,
		const af::Render * i_render)
		{ if( ms_DBQueue ) ms_DBQueue->addTask( i_exec, i_progress, i_job, i_render );}

private:
	static af::MsgQueue * MsgDispatchQueue_M;
	static af::MsgQueue * MsgDispatchQueue_T;
	static FileQueue    * FileWriteQueue;
	static LogQueue     * OutputLogQueue;
	static DBQueue      * ms_DBQueue;

//   static bool detach();
};
