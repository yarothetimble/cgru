# -*- coding: utf-8 -*-


from parsers import parser

import re

re_frame = re.compile(r'PROGRESS: .* (.*): .* Seconds')

Errors = ['aerender Error', 'After Effects error', 'Unable to Render']


class afterfx(parser.parser):
	"""Adobe After Effects
	"""

	def __init__(self):
		parser.parser.__init__(self)
		self.firstframe = True
		self.data_all = ''
		
		#helper for finding num of frames
		self.numFramesFound = False

	def do(self, data, mode):
		self.data_all += data
		
		if not self.numFramesFound:
			try:
				idx = data.index( "End:" )
			except ValueError:
				idx = -1
			if not idx==-1:
				tmpData = data[ idx+5: ]
				
				tc = tmpData.split( '\\r' )[0].split(':')
				tc.reverse()
				
				multiply = [ 1, 24, 24*60, 24*60*60 ]
				idx = 0
				for val in tc:
					self.numframes += int(val) * multiply[idx]
					idx += 1
				self.numFramesFound = True
				
		for error in Errors:
			if data.find(error) != -1:
				self.error = True
				break

		# Check whether was any progress:
		if mode == 'finished':
			if self.data_all.find('PROGRESS') == -1:
				self.badresult = True

		match = re_frame.search(data)
		if match is None:
			return
		
		frame = self.frame
		for match in re_frame.finditer( data ):
			try:
				frame = int( match.groups()[0][1:-1] ) - 1
			except ValueError:
				pass
		
		self.frame = frame

		self.firstframe = False
		self.calculate()
