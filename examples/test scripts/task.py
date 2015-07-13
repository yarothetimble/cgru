#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import random
# import signal
import sys
import time


def interrupt(signum, frame):
	exit('\nInterrupt signal received...')

# Set interrupt function:
# signal.signal( signal.SIGTERM, interrupt)
# signal.signal( signal.SIGABRT, interrupt)
#signal.signal( signal.SIGINT,  interrupt)

from time import strftime

print('Started at ' + strftime('%A %d %B %H:%M:%S'))

from optparse import OptionParser

parser = OptionParser(usage='usage: %prog [options]', version='%prog 1.0')
parser.add_option('-s', '--start',     dest='start',     type='int',    default=1,  help='start frame number')
parser.add_option('-e', '--end',       dest='end',       type='int',    default=1,  help='end frame number')
parser.add_option('-i', '--increment', dest='increment', type='int',    default=1,  help='frame increment')
parser.add_option('-t', '--time',      dest='timesec',   type='float',  default=2,  help='time per frame in seconds')
parser.add_option('-r', '--randtime',  dest='randtime',  type='float',  default=0,  help='random time per frame in seconds')
parser.add_option('-f', '--file',      dest='filename',  type='string', default='', help='file name to open and print in stdout')
parser.add_option('-v', '--verbose',   dest='verbose',   type='int',    default=0,  help='verbose')
parser.add_option('-c', '--cpunum',    dest='cpunum',    type='int',    default=0,  help='number of processors to use')
parser.add_option('-p', '--pkp',       dest='pkp',       type='int',    default=10, help='parser key percentage')
parser.add_option('-H', '--HOSTS',     dest='hosts',     type='string', default='', help='hosts list')
parser.add_option('--exitstatus',      dest='exitstatus',type='int',    default=0,  help='good exit status')

options, args = parser.parse_args()

frame_start = options.start
frame_end = options.end
frame_inc = options.increment
timesec = options.timesec
randtime = options.randtime
filename = options.filename
verbose = options.verbose
cpunum = options.cpunum

ParserKeys = ['[ PARSER WARNING ]', '[ PARSER ERROR ]',
			  '[ PARSER BAD RESULT ]', '[ PARSER FINISHED SUCCESS ]']

print('COMMAND:')
print(sys.argv)
print('WORKING DIRECTORY:')
print(os.getcwd())

# Check frame range settings:
if frame_end < frame_start:
	print('Error: frame_end(%d) < frame_start(%d)' % (frame_end, frame_start))
	frame_end = frame_start
	print('[ PARSER WARNING ]')

if frame_inc < 1:
	print('Error: frame_inc(%d) < 1' % frame_inc)
	frame_inc = 1
	print('[ PARSER WARNING ]')

# Open some file if specified:
if filename != '':
	print('FILE:')
	print(filename)
	with open(filename) as f:
		for line in f:
			print(line)

#sleepsec = .01 * (timesec + randtime*random.random()) / ( verbose + 1 )
sleepsec = .01 * (timesec + randtime * random.random())

frame = frame_start
parserKey_CurIndex = int(random.random() * 100) % len(ParserKeys)

time_start = time.time()
print('Started at: %s' % time.ctime(time_start))

while frame <= frame_end:
	print('FRAME: %s' % frame)
	#	time.sleep(sleepsec)
	for p in range(100):
		print('PROGRESS: {progress}%'.format(progress=p + 1))
		if p == 10:
			print('ACTIVITY: Generating')
		if p == 50:
			print('ACTIVITY: Rendering')
		if p == 90:
			print('ACTIVITY: Finalizing')
		if random.random() * 100 * 100 < options.pkp:
			print(ParserKeys[parserKey_CurIndex])
			parserKey_CurIndex += 1
			if parserKey_CurIndex >= len(ParserKeys):
				parserKey_CurIndex = 0
				# if p == 50:
				#     print('[ PARSER FINISHED SUCCESS ]')
				# if p == 50:
				#     print('[ PARSER ERROR ]')
		for v in range(verbose):
			print(
				'%s: %s: %s: QWERTYUIOPASDFGHJKLZXCVBNM1234567890qwertyuiopasd'
				'fghjklzxcvbnm' % (frame, p, v)
			)
			# sys.stdout.flush()
			# time.sleep(sleepsec)
		sys.stdout.flush()
		time.sleep(sleepsec)
	frame += frame_inc

time_finish = time.time()
print('Finished at: %s' % time.ctime(time_finish))
print('Sleeping = %f seconds.' % sleepsec)
print('Running time = %d seconds.' % (time_finish - time_start))

sys.stdout.flush()

if options.exitstatus != 0:
	print('Good exit status is "%d"' % options.exitstatus)
sys.exit( options.exitstatus)
