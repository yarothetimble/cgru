from parsers import hbatch
from parsers import mantra

class hbatch_mantra( hbatch.hbatch, mantra.mantra):
   'Houdini batch + catch mantra node output'
   def __init__( self, frames = 1):
      hbatch.hbatch.__init__( self, frames)
      mantra.mantra.__init__( self, frames)

   def do( self, data, mode):
      #print data
      mantra.mantra.do( self, data, mode)
      hbatch.hbatch.do( self, data, mode)
