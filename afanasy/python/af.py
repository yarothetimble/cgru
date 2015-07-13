#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
import os
import re
import sys
import time

import cgruconfig
import cgrupathmap
import afnetwork
import services  # this seems unneccessary not used

Pathmap = cgrupathmap.PathMap()


def checkRegExp(pattern):
	"""Missing DocString

	:param pattern:
	:return:
	"""
	result = True
	try:
		re.compile(pattern)
	except:  # TODO: Too broad exception clause
		print('Error: Invalid regular expression pattern "%s"' % pattern)
		print(str(sys.exc_info()[1]))
		result = False
	return result


def checkClass(name, folder):
	"""Missing DocString

	:param name:
	:param folder:
	:return:
	"""
	filename = name + '.py'
	path = os.path.join(cgruconfig.VARS['AF_ROOT'], 'python')
	path = os.path.join(path, folder)
	if filename in os.listdir(path):
		return True
	return False


class Task:
	"""Missing DocString
	"""

	def __init__(self, taskname=''):
		self.data = dict()
		self.setName(taskname)

	def setName(self, name):
		"""Missing DocString

		:param name:
		:return:
		"""
		if name != '':
			self.data["name"] = name

	def setCommand(self, command, TransferToServer=True):
		"""Missing DocString

		:param command:
		:param TransferToServer:
		:return:
		"""
		if TransferToServer:
			command = Pathmap.toServer(command)
		self.data["command"] = command

	def setFiles(self, files, TransferToServer=True):
		"""Missing DocString

		:param files:
		:param TransferToServer:
		:return:
		"""
		if not "files" in self.data:
			self.data["files"] = []

		for afile in files:
			if TransferToServer:
				afile = Pathmap.toServer(afile)
			self.data["files"].append(afile)


class Block:
	"""Missing DocString
	"""

	def __init__(self, blockname='block', service='generic'):
		self.data = dict()
		self.data["name"] = blockname
		self.data["service"] = cgruconfig.VARS['af_task_default_service']
		self.data["capacity"] = int(
			cgruconfig.VARS['af_task_default_capacity'])
		self.data["working_directory"] = Pathmap.toServer(
			os.getenv('PWD', os.getcwd()))
		self.data["numeric"] = False
		self.tasks = []
		if service is not None and len(service):
			if self.setService(service):
				__import__("services", globals(), locals(), [self.data["service"]])
				parser = eval(('services.%s.parser') % self.data["service"])
				self.setParser(parser)

	def setService(self, service, nocheck=False):
		"""Missing DocString

		:param service:
		:param nocheck:
		:return:
		"""
		if service is not None and len(service):
			result = True
			if not nocheck:
				if not checkClass(service, 'services'):
					print('Error: Unknown service "%s", setting to "generic"' %
						  service)
					service = 'generic'
					result = False
			self.data["service"] = service
			return result
		return False

	def setParser(self, parser, nocheck=False):
		"""Missing DocString

		:param parser:
		:param nocheck:
		:return:
		"""
		if parser is not None and len(parser):
			if not nocheck:
				if not checkClass(parser, 'parsers'):
					if parser != 'none':
						print('Error: Unknown parser "%s", setting to "none"' %
							  parser)
						parser = 'none'
			self.data["parser"] = parser

	def setNumeric(self, start=1, end=1, pertask=1, increment=1):
		"""Missing DocString

		:param int start:
		:param int end:
		:param int pertask:
		:param int increment:
		:return:
		"""
		if len(self.tasks):
			print('Error: Block.setNumeric: Block already has tasks.')
			return
		if end < start:
			print(
			'Error: Block.setNumeric: end < start (%d < %d)' % (
			end, start))
			end = start
		if pertask < 1:
			print('Error: Block.setNumeric: pertask < 1 (%d < 1)' % pertask)
			pertask = 1
		self.data["numeric"] = True
		self.data["frame_first"] = start
		self.data["frame_last"] = end
		self.data["frames_per_task"] = pertask
		self.data["frames_inc"] = increment


	def setFramesPerTask(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		self.data["frames_per_task"] = value


	def setSequential(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		self.data["sequential"] = value


	def setCapacity(self, capacity):
		"""Missing DocString

		:param capacity:
		:return:
		"""
		if capacity > 0:
			self.data["capacity"] = capacity

	def setVariableCapacity(self, capacity_coeff_min, capacity_coeff_max):
		"""Missing DocString

		:param capacity_coeff_min:
		:param capacity_coeff_max:
		:return:
		"""
		if capacity_coeff_min >= 0 or capacity_coeff_max >= 0:
			self.data["capacity_coeff_min"] = capacity_coeff_min
			self.data["capacity_coeff_max"] = capacity_coeff_max

	def setWorkingDirectory(self, working_directory, TransferToServer=True):
		"""Missing DocString

		:param working_directory:
		:param TransferToServer:
		:return:
		"""
		if TransferToServer:
			working_directory = Pathmap.toServer(working_directory)
		self.data["working_directory"] = working_directory

	def setCommand(self, command, prefix=True, TransferToServer=True):
		"""Missing DocString

		:param command:
		:param prefix:
		:param TransferToServer:
		:return:
		"""
		if prefix:
			command = \
				os.getenv('AF_CMD_PREFIX',
						  cgruconfig.VARS['af_cmdprefix']) + command
		if TransferToServer:
			command = Pathmap.toServer(command)
		self.data["command"] = command

	def setCmdPre(self, command_pre, TransferToServer=True):
		"""Missing DocString

		:param command_pre:
		:param TransferToServer:
		:return:
		"""
		if TransferToServer:
			command_pre = Pathmap.toServer(command_pre)
		self.data["command_pre"] = command_pre

	def setCmdPost(self, command_post, TransferToServer=True):
		"""Missing DocString

		:param command_post:
		:param TransferToServer:
		:return:
		"""
		if TransferToServer:
			command_post = Pathmap.toServer(command_post)
		self.data["command_post"] = command_post

	def setFiles(self, files, TransferToServer=True):
		"""Missing DocString

		:param files:
		:param TransferToServer:
		:return:
		"""
		if not "files" in self.data:
			self.data["files"] = []

		for afile in files:
			if TransferToServer:
				afile = Pathmap.toServer(afile)
			self.data["files"].append(afile)

	def setName(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		self.data["name"] = value

	def setTasksName(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		self.data["tasks_name"] = value

	def setParserCoeff(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		self.data["parser_coeff"] = value

	def setErrorsAvoidHost(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		self.data["errors_avoid_host"] = value

	def setErrorsForgiveTime(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		self.data["errors_forgive_time"] = value

	def setErrorsRetries(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		self.data["errors_retries"] = value

	def setErrorsTaskSameHost(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		self.data["errors_task_same_host"] = value

	def setNeedHDD(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		self.data["need_hdd"] = value

	def setNeedMemory(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		self.data["need_memory"] = value

	def setNeedPower(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		self.data["need_power"] = value

	def setDependSubTask(self, value=True):
		"""Missing DocString

		:param value:
		:return:
		"""
		self.data["depend_sub_task"] = value

	def setTasksMaxRunTime(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		if value > 0:
			self.data["tasks_max_run_time"] = value

	def setMaxRunningTasks(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		if value >= 0:
			self.data["max_running_tasks"] = value

	def setMaxRunTasksPerHost(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		if value >= 0:
			self.data["max_running_tasks_per_host"] = value

	def setHostsMask(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		if checkRegExp(value):
			self.data["hosts_mask"] = value

	def setHostsMaskExclude(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		if checkRegExp(value):
			self.data["hosts_mask_exclude"] = value

	def setDependMask(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		if checkRegExp(value):
			self.data["depend_mask"] = value

	def setTasksDependMask(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		if checkRegExp(value):
			self.data["tasks_depend_mask"] = value

	def setNeedProperties(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		if checkRegExp(value):
			self.data["need_properties"] = value

	# def setGenThumbnails(self, value = True):
	# self.data["gen_thumbnails"] = value;

	def setDoPost(self, value=True):
		"""Missing DocString

		:param value:
		:return:
		"""
		self.data["do_post"] = value

	def setMultiHost(self, h_min, h_max, h_max_wait, master_on_slave=False,
					 service=None, service_wait=-1):
		"""Missing DocString

		:param h_min:
		:param h_max:
		:param h_max_wait:
		:param master_on_slave:
		:param service:
		:param service_wait:
		:return:
		"""
		if h_min < 1:
			print('Error: Block::setMultiHost: Minimum must be greater then '
				  'zero.')
			return False

		if h_max < h_min:
			print('Block::setMultiHost: Maximum must be greater or equal then '
				  'minimum.')
			return False

		if master_on_slave and service is None:
			print('Error: Block::setMultiHost: Master in slave is enabled but '
				  'service was not specified.')
			return False

		self.data['multihost_min'] = h_min
		self.data['multihost_max'] = h_max
		self.data['multihost_max_wait'] = h_max_wait

		if master_on_slave:
			self.data['multihost_master_on_slave'] = master_on_slave

		if service:
			self.data['multihost_service'] = service

		if service_wait > 0:
			self.data['multihost_service_wait'] = service_wait

	def fillTasks(self):
		"""Missing DocString
		"""
		if len(self.tasks):
			self.data["tasks"] = []
			for task in self.tasks:
				self.data["tasks"].append(task.data)


class Job:
	"""Missing DocString

	:param jobname:
	:param verbose:
	"""

	def __init__(self, jobname=None, verbose=False):
		self.data = dict()
		self.data["name"] = "noname"
		self.data["user_name"] = cgruconfig.VARS['USERNAME']
		self.data["host_name"] = cgruconfig.VARS['HOSTNAME']
		self.data["priority"] = cgruconfig.VARS['af_priority']
		self.data["time_creation"] = int(time.time())
		self.setName(jobname)
		self.blocks = []

	def setName(self, name):
		"""Missing DocString

		:param name:
		:return:
		"""
		if name is not None and len(name):
			self.data["name"] = name

	def setUserName(self, username):
		"""Missing DocString

		:param username:
		:return:
		"""
		if username is not None and len(username):
			self.data["user_name"] = username.lower()

	def setPriority(self, priority):
		"""Missing DocString

		:param priority:
		:return:
		"""
		if priority < 0:
			return

		if priority > 250:
			priority = 250
			print('Warning: priority clamped to maximum = %d' % priority)

		self.data["priority"] = priority

	def setCmdPre(self, command, TransferToServer=True):
		"""Missing DocString

		:param command:
		:param TransferToServer:
		:return:
		"""
		if TransferToServer:
			command = Pathmap.toServer(command)
		self.data["command_pre"] = command

	def setCmdPost(self, command, TransferToServer=True):
		"""Missing DocString

		:param command:
		:param TransferToServer:
		:return:
		"""
		if TransferToServer:
			command = Pathmap.toServer(command)
		self.data["command_post"] = command

	def setFolder(self, i_name, i_folder, i_transferToServer=True):
		"""Missing DocString

		:param i_name:
		:param i_folder:
		:param i_transferToServer:
		:return:
		"""
		if i_transferToServer:
			i_folder = Pathmap.toServer(i_folder)

		if not "folders" in self.data:
			self.data["folders"] = dict()

		self.data["folders"][i_name] = i_folder

	def fillBlocks(self):
		"""Missing DocString

		:return:
		"""
		self.data["blocks"] = []
		for block in self.blocks:
			block.fillTasks()
			self.data["blocks"].append(block.data)

	def output(self, full=False):
		"""Missing DocString

		:param full:
		:return:
		"""
		self.fillBlocks()
		print(json.dumps(self.data, sort_keys=True, indent=4))

	def send(self, verbose=False):
		"""Missing DocString

		:param verbose:
		:return:
		"""
		if len(self.blocks) == 0:
			print('Error: Job has no blocks')
		# return False
		self.fillBlocks()

		obj = {"job": self.data}
		# print(json.dumps( obj))

		return afnetwork.sendServer(json.dumps(obj), True, verbose)

	def setAnnotation(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		self.data["annotation"] = value

	def setDescription(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		self.data["description"] = value

	def setWaitTime(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		if value > 0:
			self.data["time_wait"] = value

	def setMaxRunningTasks(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		if value >= 0:
			self.data["max_running_tasks"] = value

	def setMaxRunTasksPerHost(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		if value >= 0:
			self.data["max_running_tasks_per_host"] = value

	def setHostsMask(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		if checkRegExp(value):
			self.data["hosts_mask"] = value

	def setHostsMaskExclude(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		if checkRegExp(value):
			self.data["hosts_mask_exclude"] = value

	def setDependMask(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		if checkRegExp(value):
			self.data["depend_mask"] = value

	def setDependMaskGlobal(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		if checkRegExp(value):
			self.data["depend_mask_global"] = value

	def setNeedOS(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		if checkRegExp(value):
			self.data["need_os"] = value

	def setNeedProperties(self, value):
		"""Missing DocString

		:param value:
		:return:
		"""
		if checkRegExp(value):
			self.data["need_properties"] = value

	def setNativeOS(self):
		"""Missing DocString
		"""
		self.data["need_os"] = cgruconfig.VARS['platform'][-1]

	def setAnyOS(self):
		"""Missing DocString
		"""
		self.data["need_os"] = ''

	def setPPApproval(self):
		self.data["ppa"] = True

	def pause(self):
		"""Missing DocString
		"""
		self.data["offline"] = True

	def setPaused(self):
		"""Missing DocString
		"""
		self.data["offline"] = True

	def setOffline(self):
		"""Missing DocString
		"""
		self.data["offline"] = True

	def offline(self):
		"""Missing DocString
		"""
		self.data["offline"] = True

	def offLine(self):
		"""Missing DocString
		"""
		self.data["offline"] = True


class Cmd:
	"""Missing DocString
	"""

	def __init__(self):
		self.data = dict()
		self.data['user_name'] = cgruconfig.VARS['USERNAME']
		self.data['host_name'] = cgruconfig.VARS['HOSTNAME']
		self.action = None

	def _sendRequest(self, verbose=False):
		"""Missing DocString

		:param bool verbose:
		:return:
		"""
		if self.action is None:
			print('ERROR: Action is not set.')
			return None

		receive = (self.action == 'get')
		obj = {self.action: self.data}
		# print(json.dumps( obj))
		output = afnetwork.sendServer(json.dumps(obj), receive, verbose)

		if output[0] is True:
			return output[1]
		else:
			return None

	def getJobList(self, verbose=False):
		"""Missing DocString

		:param bool verbose:
		:return:
		"""
		self.action = 'get'
		self.data['type'] = 'jobs'
		data = self._sendRequest()
		if data is not None:
			if 'jobs' in data:
				return data['jobs']
		return None

	def deleteJob(self, jobName, verbose=False):
		"""Missing DocString

		:param str jobName:
		:param bool verbose:
		:return:
		"""
		self.action = 'action'
		self.data['type'] = 'jobs'
		self.data['mask'] = jobName
		self.data['operation'] = {'type': 'delete'}
		return self._sendRequest(verbose)

	def getJobInfo(self, jobId, verbose=False):
		"""Missing DocString

		:param jobId:
		:param bool verbose:
		:return:
		"""
		self.data['ids'] = [jobId]
		self.data['mode'] = 'full'
		return self.getJobList(verbose)

	def renderSetNimby(self, text):
		"""Missing DocString

		:param text:
		:return:
		"""
		self.action = 'action'
		self.data['type'] = 'renders'
		self.data['mask'] = cgruconfig.VARS['HOSTNAME']
		self.data['params'] = {'nimby': True}
		self._sendRequest()

	def renderSetNIMBY(self, text):
		"""Missing DocString

		:param text:
		:return:
		"""
		self.action = 'action'
		self.data['type'] = 'renders'
		self.data['mask'] = cgruconfig.VARS['HOSTNAME']
		self.data['params'] = {'NIMBY': True}
		self._sendRequest()

	def renderSetFree(self, text):
		"""Missing DocString

		:param text:
		:return:
		"""
		self.action = 'action'
		self.data['type'] = 'renders'
		self.data['mask'] = cgruconfig.VARS['HOSTNAME']
		self.data['params'] = {'nimby': False}
		self._sendRequest()

	def renderEjectTasks(self, text):
		"""Missing DocString

		:param text:
		:return:
		"""
		self.action = 'action'
		self.data['type'] = 'renders'
		self.data['mask'] = cgruconfig.VARS['HOSTNAME']
		self.data['operation'] = {'type': 'eject_tasks'}
		self._sendRequest()

	def renderEjectNotMyTasks(self, text):
		"""Missing DocString

		:param text:
		:return:
		"""
		self.action = 'action'
		self.data['type'] = 'renders'
		self.data['mask'] = cgruconfig.VARS['HOSTNAME']
		self.data['operation'] = {'type': 'eject_tasks_keep_my'}
		self._sendRequest()

	def renderExit(self, text):
		"""Missing DocString

		:param text:
		:return:
		"""
		self.action = 'action'
		self.data['type'] = 'renders'
		self.data['mask'] = cgruconfig.VARS['HOSTNAME']
		self.data['operation'] = {'type': 'exit'}
		self._sendRequest()

	def monitorExit(self, text):
		"""Missing DocString

		:param text:
		:return:
		"""
		self.action = 'action'
		self.data['type'] = 'monitors'
		self.data['mask'] = cgruconfig.VARS['USERNAME'] + '@' + \
							cgruconfig.VARS['HOSTNAME'] + ':.*'
		self.data['operation'] = {'type': 'exit'}
		self._sendRequest()

	def renderGetList(self, mask=None):
		"""Missing DocString

		:param mask:
		:return:
		"""
		self.action = 'get'
		self.data['type'] = 'renders'
		if mask is not None:
			self.data['mask'] = mask
		data = self._sendRequest()
		if data is not None:
			if 'renders' in data:
				return data['renders']
		return None

	def renderGetLocal(self):
		"""Missing DocString

		:return:
		"""
		return self.renderGetList(cgruconfig.VARS['HOSTNAME'])
