#!/bin/sh
# 
# Copyright 2023-2026 Rafał Wabik (IceG) - From eko.one.pl forum
# Licensed to the GNU General Public License v3.0.
#

chmod +x /sbin/sms_led.sh >/dev/null 2>&1 &
chmod +x /sbin/smstool_led.sh >/dev/null 2>&1 &
chmod +x /sbin/new_cron_sync.sh >/dev/null 2>&1 &
chmod +x /etc/uci-defaults/off_sms.sh >/dev/null 2>&1 &
chmod +x /etc/uci-defaults/setup_sms_tool_js.sh >/dev/null 2>&1 &
chmod +x /etc/init.d/my_new_sms >/dev/null 2>&1 &

rm -rf /tmp/luci-indexcache >/dev/null 2>&1 &
rm -rf /tmp/luci-modulecache/ >/dev/null 2>&1 &
exit 0
