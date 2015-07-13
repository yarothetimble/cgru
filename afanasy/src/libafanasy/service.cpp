#include "service.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "../include/afanasy.h"
#include "../include/afpynames.h"

#include "../libafanasy/environment.h"

using namespace af;

#define AFOUTPUT
#undef AFOUTPUT
#include "../include/macrooutput.h"

Service::Service(
	const std::string & i_type,
	const std::string & i_wdir,
	const std::string & i_command,
	const std::vector<std::string> & i_files,
	const std::string & i_store_dir
):
	m_name( i_type),
	m_wdir( i_wdir),
	m_command( i_command)
{
	TaskExec * i_task_exec = new TaskExec(
			"i_name", i_type, "", i_command,
			1, -1, -1,
			i_files,
			1, 1, 1,
			i_wdir,
			"", 1, 0, 0, 1
		);
	initialize( i_task_exec, i_store_dir);
	delete i_task_exec;
}

Service::Service( const TaskExec * i_task_exec, const std::string & i_store_dir):
	m_name( i_task_exec->getServiceType()),
	m_parser_type( i_task_exec->getParserType()),
	m_wdir( i_task_exec->getWDir()),
	m_command( i_task_exec->getCommand())
{
	initialize( i_task_exec, i_store_dir);
}

void Service::initialize( const TaskExec * i_task_exec, const std::string & i_store_dir)
{
	m_PyObj_FuncGetWDir = NULL;
	m_PyObj_FuncGetCommand = NULL;
	m_PyObj_FuncGetFiles = NULL;
	m_PyObj_FuncGetParsedFiles = NULL;
	m_PyObj_FuncParse = NULL;
	m_PyObj_FuncCheckExitStatus = NULL;
	m_PyObj_FuncDoPost = NULL;
	m_initialized = false;

	PyObject * pFilesList = PyList_New(0);
	for( int i = 0; i < i_task_exec->getFiles().size(); i++)
		PyList_Append( pFilesList, PyBytes_FromString( i_task_exec->getFiles()[i].c_str() ));

	PyObject * pParsedFilesList = PyList_New(0);
	for( int i = 0; i < i_task_exec->getParsedFiles().size(); i++)
		PyList_Append( pParsedFilesList, PyBytes_FromString( i_task_exec->getParsedFiles()[i].c_str() ));

	PyObject * pHostsList = PyList_New(0);
	for( std::list<std::string>::const_iterator it = i_task_exec->getMultiHostsNames().begin();
			it != i_task_exec->getMultiHostsNames().end(); it++)
		PyList_Append( pHostsList, PyBytes_FromString((*it).c_str()));


	PyObject *pArgs;
	pArgs = PyTuple_New( 2);

	PyObject *task_info;
	task_info = PyDict_New();

	PyDict_SetItemString( task_info, "wdir",         PyBytes_FromString( i_task_exec->getWDir().c_str()));
	PyDict_SetItemString( task_info, "command",      PyBytes_FromString( i_task_exec->getCommand().c_str()));
	PyDict_SetItemString( task_info, "capacity",     PyLong_FromLong( i_task_exec->getCapCoeff()));
	PyDict_SetItemString( task_info, "files",        pFilesList);
	PyDict_SetItemString( task_info, "hosts",        pHostsList);
	PyDict_SetItemString( task_info, "parsed_files", pParsedFilesList);

	PyDict_SetItemString( task_info, "parser",     PyBytes_FromString( m_parser_type.c_str()));
	PyDict_SetItemString( task_info, "frames_num", PyLong_FromLong(    i_task_exec->getFramesNum()));

	PyDict_SetItemString( task_info, "task_id",          PyLong_FromLong( i_task_exec->getTaskNum()));
	PyDict_SetItemString( task_info, "task_name",        PyBytes_FromString( i_task_exec->getName().c_str()));
	PyDict_SetItemString( task_info, "task_custom_data", PyBytes_FromString( i_task_exec->m_custom_data_task.c_str()));

	PyDict_SetItemString( task_info, "block_id",          PyLong_FromLong( i_task_exec->getBlockNum()));
	PyDict_SetItemString( task_info, "block_name",        PyBytes_FromString( i_task_exec->getBlockName().c_str()));
	PyDict_SetItemString( task_info, "block_flags",       PyLong_FromLong( i_task_exec->getBlockFlags()));
	PyDict_SetItemString( task_info, "block_custom_data", PyBytes_FromString( i_task_exec->m_custom_data_block.c_str()));

	PyDict_SetItemString( task_info, "job_id",          PyLong_FromLong( i_task_exec->getJobId()));
	PyDict_SetItemString( task_info, "job_name",        PyBytes_FromString( i_task_exec->getJobName().c_str()));
	PyDict_SetItemString( task_info, "job_flags",       PyLong_FromLong( i_task_exec->getJobFlags()));
	PyDict_SetItemString( task_info, "job_custom_data", PyBytes_FromString( i_task_exec->m_custom_data_job.c_str()));

	PyDict_SetItemString( task_info, "user_name",        PyBytes_FromString( i_task_exec->getUserName().c_str()));
	PyDict_SetItemString( task_info, "user_flags",       PyLong_FromLong( i_task_exec->getUserFlags()));
	PyDict_SetItemString( task_info, "user_custom_data", PyBytes_FromString( i_task_exec->m_custom_data_user.c_str()));

	PyDict_SetItemString( task_info, "render_flags",       PyLong_FromLong( i_task_exec->getRenderFlags()));
	PyDict_SetItemString( task_info, "render_custom_data", PyBytes_FromString( i_task_exec->m_custom_data_render.c_str()));

	PyDict_SetItemString( task_info, "store_dir", PyBytes_FromString( i_store_dir.c_str()));

	PyTuple_SetItem( pArgs, 0, task_info);
	PyTuple_SetItem( pArgs, 1, PyBool_FromLong( af::Environment::isVerboseMode()));

	// Try to import service class
	if( false == PyClass::init( AFPYNAMES::SERVICE_CLASSESDIR, m_name, pArgs))
		// If failed and imported class was not the base class
		if( m_name != AFPYNAMES::SERVICE_CLASSESBASE )
			// Try to import base service
			if( false == PyClass::init( AFPYNAMES::SERVICE_CLASSESDIR, AFPYNAMES::SERVICE_CLASSESBASE, pArgs))
				return;

	//Get functions:
	m_PyObj_FuncGetWDir= getFunction( AFPYNAMES::SERVICE_FUNC_GETWDIR);
	if( m_PyObj_FuncGetWDir == NULL ) return;

	m_PyObj_FuncGetCommand = getFunction( AFPYNAMES::SERVICE_FUNC_GETCOMMAND);
	if( m_PyObj_FuncGetCommand == NULL ) return;

	m_PyObj_FuncGetFiles = getFunction( AFPYNAMES::SERVICE_FUNC_GETFILES);
	if( m_PyObj_FuncGetFiles == NULL ) return;

	m_PyObj_FuncGetParsedFiles = getFunction( AFPYNAMES::SERVICE_FUNC_GETPARSEDFILES);
	if( m_PyObj_FuncGetParsedFiles == NULL ) return;

	m_PyObj_FuncParse = getFunction( AFPYNAMES::SERVICE_FUNC_PARSE);
	if( m_PyObj_FuncParse == NULL ) return;

	m_PyObj_FuncCheckExitStatus = getFunction( AFPYNAMES::SERVICE_FUNC_CHECKEXITSTATUS);
	if( m_PyObj_FuncParse == NULL ) return;

	m_PyObj_FuncDoPost = getFunction( AFPYNAMES::SERVICE_FUNC_DOPOST);
	if( m_PyObj_FuncDoPost == NULL ) return;

	PyObject * pResult;

	// Process working directory:
	AFINFA("Service::initialize: Processing working dirctory:\n%s", m_wdir.c_str())
	pResult = PyObject_CallObject( m_PyObj_FuncGetWDir, NULL);
	if( pResult == NULL)
	{
		if( PyErr_Occurred()) PyErr_Print();
		return;
	}
	if( false == af::PyGetString( pResult, m_wdir))
	{
		AFERROR("Service:FuncGetWDir: Returned object is not a string.")
		Py_DECREF( pResult);
		return;
	}
	Py_DECREF( pResult);
	AFINFA("Service::initialize: Working dirctory:\n%s", m_wdir.c_str())

	// Process command:
	AFINFA("Service::initialize: Processing command:\n%s", m_command.c_str())
	pResult = PyObject_CallObject( m_PyObj_FuncGetCommand, NULL);
	if( pResult == NULL)
	{
		if( PyErr_Occurred()) PyErr_Print();
		return;
	}
	if( false == af::PyGetString( pResult, m_command))
	{
		AFERROR("Service:FuncGetCommand: Returned object is not a string.")
		Py_DECREF( pResult);
		return;
	}
	Py_DECREF( pResult);
	AFINFA("Service::initialize: Command:\n%s", m_command.c_str())

	m_initialized = true;
}

Service::~Service()
{
}

bool Service::parse( const std::string & i_mode, std::string & i_data,
							int & percent, int & frame, int & percentframe, std::string & activity,
							bool & warning, bool & error, bool & badresult, bool & finishedsuccess) const
{
	bool result = false;
//	if( data.size() < 1) return result;

	PyObject * pArgs = PyTuple_New( 2);
	PyTuple_SetItem( pArgs, 0, PyBytes_FromStringAndSize( i_data.data(), i_data.size()));
	PyTuple_SetItem( pArgs, 1, PyBytes_FromStringAndSize( i_mode.data(), i_mode.size()));

	PyObject * pTuple = PyObject_CallObject( m_PyObj_FuncParse, pArgs);
	if( pTuple != NULL)
	{
		if( PyTuple_Check( pTuple))
		{
			if( PyTuple_Size( pTuple) == 9)
			{
				percent           = PyLong_AsLong(   PyTuple_GetItem( pTuple, 1));
				frame             = PyLong_AsLong(   PyTuple_GetItem( pTuple, 2));
				percentframe      = PyLong_AsLong(   PyTuple_GetItem( pTuple, 3));
				warning           = PyObject_IsTrue( PyTuple_GetItem( pTuple, 4));
				error             = PyObject_IsTrue( PyTuple_GetItem( pTuple, 5));
				badresult         = PyObject_IsTrue( PyTuple_GetItem( pTuple, 6));
				finishedsuccess   = PyObject_IsTrue( PyTuple_GetItem( pTuple, 7));

				PyObject * pActivity = PyTuple_GetItem( pTuple, 8);
				if( pActivity == NULL)
				{
					if( PyErr_Occurred()) PyErr_Print();
				}
				else
				{
					af::PyGetString( pActivity, activity, "Service::parse: activity");
//printf("Activity: %s\n", activity.c_str());
				}

				PyObject * pOutput = PyTuple_GetItem( pTuple, 0);
				if( pOutput == NULL)
				{
					if( PyErr_Occurred()) PyErr_Print();
				}
				else if( pOutput == Py_None)
				{
					result = true;
				}
				else
				{
					if( af::PyGetString( pOutput, i_data, "Service::parse: output"))
						result = true;
				}
			}
			else
			{
				AFERRAR("Service::parse: parser=\"%s\" returned tuple size != 9\n", m_parser_type.c_str());
			}
		}
		else if( pTuple != Py_None)
		{
			AFERRAR("Service::parse: parser=\"%s\" returned value is not a tuple\n", m_parser_type.c_str());
		}

		Py_DECREF( pTuple);
	}
	else
	{
		if( PyErr_Occurred()) PyErr_Print();
	}

	Py_DECREF( pArgs);

	return result;
}

bool Service::checkExitStatus( int i_status) const
{
	PyObject * pArgs = PyTuple_New( 1);
	PyTuple_SetItem( pArgs, 0, PyLong_FromLong( i_status));

	PyObject * pResult = PyObject_CallObject( m_PyObj_FuncCheckExitStatus, pArgs);

	if( pResult == NULL)
	{
		if( PyErr_Occurred()) PyErr_Print();
		return true;
	}

	if( true != PyBool_Check( pResult))
	{
		AFERROR("Service::checkExitStatus: Return object type is not a boolean.")
		return true;
	}

	bool result = PyObject_IsTrue( pResult);

	Py_DECREF( pResult);

	//printf("Service::checkExitStatus: %d %d\n", i_status, result);
	return result;
}

const std::vector<std::string> Service::doPost()
{
	AFINFA("Service::doPost()")

	std::vector<std::string> cmds;

	PyObject * pResult = PyObject_CallObject( m_PyObj_FuncDoPost, NULL);
	if( pResult )
	{
		if( false == af::PyGetStringList( pResult, cmds))
			AFERRAR("Service:goPost: '%s': returned object is not a string.", m_name.c_str())

		Py_DECREF( pResult);
	}
	else if( PyErr_Occurred())
		PyErr_Print();

	return cmds;
}

const std::vector<std::string> Service::getFiles() const
{
	std::vector<std::string> files;

	PyObject * pResult = PyObject_CallObject( m_PyObj_FuncGetFiles, NULL);
	if( pResult )
	{
		if( false == af::PyGetStringList( pResult, files))
			AFERRAR("Service:getFiles: '%s': returned object is not a string.", m_name.c_str())

		Py_DECREF( pResult);
	}
	else if( PyErr_Occurred())
		PyErr_Print();

	return files;
}

const std::vector<std::string> Service::getParsedFiles() const
{
//printf("Service::getParsedFiles():\n");
	std::vector<std::string> files;

	PyObject * pResult = PyObject_CallObject( m_PyObj_FuncGetParsedFiles, NULL);
	if( pResult )
	{
		if( false == af::PyGetStringList( pResult, files))
			AFERRAR("Service:getParsedFiles: '%s': returned object is not a string.", m_name.c_str())

		Py_DECREF( pResult);
	}
	else if( PyErr_Occurred())
		PyErr_Print();

	return files;
}

