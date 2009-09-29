require File.expand_path('simple', File.dirname(__FILE__))

# Basically, just test that the methods work.  Assumes no one else is messing
# with the pcounters now.  Use a "wierd" counter so we don't accidentally trash
# a counter that may be in use.
counter = 87
test(Gemstone.set_pcounter(counter, 10), 10, 'set_pcounter')
test(Gemstone.pcounter(counter), 10, 'pcounter')
test(Gemstone.increment_pcounter(counter, 12), 22, 'increment_pcounter(12)')
test(Gemstone.increment_pcounter(counter), 23, 'increment_pcounter')
test(Gemstone.decrement_pcounter(counter), 22, 'decrement_pcounter')
test(Gemstone.decrement_pcounter(counter, 7), 15, 'decrement_pcounter(7)')

report
