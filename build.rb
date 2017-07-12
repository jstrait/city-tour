#!/usr/bin/env ruby

require 'rb-fsevent'

def build
  # uglifyjs v3.0.15
  `uglifyjs src/*.js src/**/*.js --compress --mangle --source-map filename=city_tour.js.map -o city_tour.js`
end

option = (ARGV[0] || '').downcase

if option == '-w' || option == '--watch'
  fsevent = FSEvent.new

  fsevent.watch 'src' do |directories|
    puts "Detected source file change, rebuilding"
    build
  end

  fsevent.run
else
  build
end
