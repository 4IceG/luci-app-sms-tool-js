#!/bin/sh
# Copyright 2023 Rafał Wabik (IceG) - From eko.one.pl forum
# Licensed to the GNU General Public License v3.0.

rm -rf /tmp/luci-indexcache  2>&1 &
rm -rf /tmp/luci-modulecache/  2>&1 &
exit 0
