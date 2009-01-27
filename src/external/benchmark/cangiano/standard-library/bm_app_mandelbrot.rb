require 'benchmark'
puts '==> Start benchmark: ./standard-library/bm_app_mandelbrot.rb'
Benchmark.bm(7) do |bmr|
  bmr.report {
### End header added by script ###

  require 'complex'
  
  def mandelbrot?(z)
    i = 0
    while i<100
      i+=1
      z = z * z
      return false if z.abs > 2
    end
    true
  end
  
  ary = []
  
  (0..100).each{|dx|
    (0..100).each{|dy|
      x = dx / 50.0
      y = dy / 50.0
      c = Complex(x, y)
      ary << c if mandelbrot?(c)
    }
  }
  
  p ary
  

### Begin footer added by script ###
}
end
puts '==> End benchmark: ./standard-library/bm_app_mandelbrot.rb'