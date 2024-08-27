#!/bin/sh


cd ..
cloc . --exclude-dir=node_modules --include-ext=js,ts,html,css
cd util
