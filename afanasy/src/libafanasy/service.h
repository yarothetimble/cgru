#pragma once

#include "name_af.h"
#include "pyclass.h"
#include "taskexec.h"

namespace af
{
class Service: public PyClass
{
public:
	Service( const std::string & i_type,
	         const std::string & i_wdir,
	         const std::string & i_command,
	         const std::vector<std::string> & i_files = std::vector<std::string>(),
	         const std::string & i_store_dir = std::string()
		);
	Service( const TaskExec * taskexec, const std::string & i_store_dir = std::string());
	~Service();

	inline bool isInitialized() const { return m_initialized;}

	inline const std::string & getWDir()    const { return m_wdir;    }
	inline const std::string & getCommand() const { return m_command; }
	const std::vector<std::string> getFiles() const;
	const std::vector<std::string> getParsedFiles() const;

	bool parse( const std::string & i_mode,
				std::string & data,
				int & percent, int & frame, int & percentframe, std::string & activity,
				bool & warning, bool & error, bool & badresult, bool & finishedsuccess) const;

	bool checkExitStatus( int i_status) const;

	// Return an empty string on sucess or an error message on error
	const std::vector<std::string> doPost();

private:
	void initialize( const TaskExec * taskExec, const std::string & i_store_dir);

private:
	std::string m_name;
	std::string m_parser_type;

	PyObject * m_PyObj_FuncGetWDir;
	PyObject * m_PyObj_FuncGetCommand;
	PyObject * m_PyObj_FuncGetFiles;
	PyObject * m_PyObj_FuncGetParsedFiles;
	PyObject * m_PyObj_FuncParse;
	PyObject * m_PyObj_FuncCheckExitStatus;
	PyObject * m_PyObj_FuncDoPost;

	bool m_initialized;

	std::string m_wdir;
	std::string m_command;
//	std::vector<std::string> m_files;
};
}
