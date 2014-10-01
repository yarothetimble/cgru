from parsers import parser

import re

re_frame = re.compile(
	r'SCEN.*(progr: begin scene preprocessing for frame )([0-9]+)'
)
re_number = re.compile(r'[0-9]+')
re_percent = re.compile( r'([0-9]{1,2}.*)(%[ ]{,}).*' )


class vray(parser.parser):
	"""VRay Standalone
	"""

	def __init__(self):
		parser.parser.__init__(self)
		self.buffer = ""
		self.numinseq = 0

	def do(self, data, mode):
		"""Missing DocString

		:param data:
		:param mode:
		:return:
		"""
		# self.buffer += data
		# needcalc = False
		# frame = False

		if len(data) < 1:
			return
			
		match = []
			
		if data.find( "Rendering image...: done" ) == -1:
			dataParsed = data.split( "Rendering image...: " )[-1]
			match = re_percent.findall(dataParsed)

		if len(match):
			if len( match[0][0] ) < 7:
				percentframe = float(match[0][0])
				self.percent = int(percentframe)
