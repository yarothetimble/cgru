from parsers import hbatch
from parsers import prman

class hbatch_prman( hbatch.hbatch, prman.prman):
   'Houdini batch + catch rib node output'
   def __init__( self, frames = 1):
      hbatch.hbatch.__init__( self, frames)
      prman.prman.__init__( self, frames)

   def do( self, data, mode):
      #print data
      if prman.prman.do( self, data, mode): self.calculate()
      hbatch.hbatch.do( self, data, mode)
