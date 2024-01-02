# luci-app-sms-tool-js

![GitHub release (latest by date)](https://img.shields.io/github/v/release/4IceG/luci-app-sms-tool-js?style=flat-square)
![GitHub stars](https://img.shields.io/github/stars/4IceG/luci-app-sms-tool-js?style=flat-square)
![GitHub forks](https://img.shields.io/github/forks/4IceG/luci-app-sms-tool-js?style=flat-square)
![GitHub All Releases](https://img.shields.io/github/downloads/4IceG/luci-app-sms-tool-js/total)

#### <img src="https://raw.githubusercontent.com/4IceG/Personal_data/master/dooffy_design_icons_EU_flags_United_Kingdom.png" height="24"> Luci-app-sms-tool-js is a conversion of the https://github.com/4IceG/luci-app-sms-tool package (Conversion is not one-to-one and not everything works as in the previous package). The LuCI JS interface supports SMS/USSD Codes/AT Commands.

#### <img src="https://raw.githubusercontent.com/4IceG/Personal_data/master/dooffy_design_icons_EU_flags_Poland.png" height="24"> Luci-app-sms-tool-js jest konwersją pakietu https://github.com/4IceG/luci-app-sms-tool (Konwersja nie jest jeden do jednego i nie wszystko działa tak jak w poprzednim pakiecie). Interfejs LuCI JS wspiera obsługę wiadomości SMS/kodów USSD/poleceń AT.

### <img src="https://raw.githubusercontent.com/4IceG/Personal_data/master/dooffy_design_icons_EU_flags_United_Kingdom.png" height="24"> What You Should Know / <img src="https://raw.githubusercontent.com/4IceG/Personal_data/master/dooffy_design_icons_EU_flags_Poland.png" height="24"> Co powinieneś wiedzieć
> My package will not work if you are using ModemManager.   
> Preferred version OpenWrt >= 21.02.

> Mój pakiet nie będzie działać jeżeli uzywasz ModemManager-a.   
> Preferowana wersja OpenWrt >= 21.02.

### <img src="https://raw.githubusercontent.com/4IceG/Personal_data/master/dooffy_design_icons_EU_flags_United_Kingdom.png" height="24"> Installation / <img src="https://raw.githubusercontent.com/4IceG/Personal_data/master/dooffy_design_icons_EU_flags_Poland.png" height="24"> Instalacja

<details>
   <summary>Pokaż | Show me</summary>

``` bash
# (optional) these dependencies will be pulled up so no need to install them manually:
opkg install kmod-usb-serial kmod-usb-serial-option sms-tool
```
- (optional) For OpenWrt < v23.05, the `sms-tool` package needs to be downloaded and install manualy:
   <details>

   #### To install the sms-tool package, we need to know the architecture name for router:

   <details>
   <summary>Pokaż jak znaleźć architekturę routera | Show how to find a router architecture.</summary>
   

   
   > For example, we are looking for sms-tool for Zbtlink router ZBT-WE3526.   
   
   #### Step 1.
   > We go to the page and enter the name of our router.  
   https://firmware-selector.openwrt.org/
   
   
   #### Step 2.
   > Click on the folder icon and go to the image download page.   
   
   ![](https://github.com/4IceG/Personal_data/blob/master/OpenWrt%20Firmware%20Selector.png?raw=true)
   
   > It should take us to a page   
   https://downloads.openwrt.org/snapshots/targets/ramips/mt7621/
   
   #### Step 3.
   > Then go into the "packages" folder at the bottom of the page.   
   https://downloads.openwrt.org/snapshots/targets/ramips/mt7621/packages/
   
   > We check what the architecture name is for our router. All packets have names ending in mipsel_24kc.ipk, so the architecture we are looking for is mipsel_24kc.
   

   </details>

   - Example of sms-tool installation using the command line.
      > In the link below, replace ```*architecture*``` with the architecture of your router, e.g. arm_cortex-a7_neon-vfpv4, mipsel_24kc.
      
      ``` bash
      wget https://downloads.openwrt.org/snapshots/packages/*architecture*/packages/sms-tool_2022-03-21-f07699ab-1_*architecture*.ipk -O /tmp/sms-tool_2022-03-21.ipk
      opkg install /tmp/sms-tool_2022-03-21.ipk
      ```
   
   - Another way is to download the package manually.
      > To do this, we go to the page.   
      https://downloads.openwrt.org/snapshots/packages/
      
      > We choose our architecture, e.g. arm_cortex-a7_neon-vfpv4, mipsel_24kc.   
      https://downloads.openwrt.org/snapshots/packages/mipsel_24kc/
      
      > Go to the "packages" folder.   
      https://downloads.openwrt.org/snapshots/packages/mipsel_24kc/packages/
      
      > Looking for "sms-tool_2022-03-21". We can use search by using Ctr + F and typing "sms-tool".
      Save the package to your computer for further installation on the router.

  </details>
- Add [my repository](https://github.com/4IceG/Modem-extras) to the image and install the package:
   ``` bash
   grep -q IceG_repo /etc/opkg/customfeeds.conf || echo 'src/gz IceG_repo https://github.com/4IceG/Modem-extras/raw/main/myrepo' >> /etc/opkg/customfeeds.conf
   wget https://github.com/4IceG/Modem-extras/raw/main/myrepo/IceG-repo.pub -O /tmp/IceG-repo.pub
   opkg-key add /tmp/IceG-repo.pub
   opkg update
   
   opkg install luci-app-sms-tool-js
   ```

For images downloaded from https://eko.one.pl/, installation procedure is similar.
   
</details>

### <img src="https://raw.githubusercontent.com/4IceG/Personal_data/master/dooffy_design_icons_EU_flags_United_Kingdom.png" height="24"> User compilation / <img src="https://raw.githubusercontent.com/4IceG/Personal_data/master/dooffy_design_icons_EU_flags_Poland.png" height="24"> Kompilacja przez użytkownika

<details>
   <summary>Pokaż | Show me</summary>
   
``` bash
#The package can be added to Openwrt sources in two ways:

cd feeds/luci/applications/
git clone https://github.com/4IceG/luci-app-sms-tool-js.git
cd ../../..
./scripts feeds update -a; ./scripts/feeds install -a
make menuconfig

or e.g.

cd packages/
git clone https://github.com/4IceG/luci-app-sms-tool-js.git
git pull
make package/symlinks
make menuconfig

#You may need to correct the file paths and the number of folders to look like this:
feeds/luci/applications/luci-app-sms-tool-js/Makefile
or
packages/luci-app-sms-tool-js/Makefile

#Then you can compile the packages one by one, an example command:
make V=s -j1 feeds/luci/applications/luci-app-sms-tool-js/compile
```
</details>

### <img src="https://raw.githubusercontent.com/4IceG/Personal_data/master/dooffy_design_icons_EU_flags_United_Kingdom.png" height="24"> Useful AT commands (My list of at commands for Quectel modems) / <img src="https://raw.githubusercontent.com/4IceG/Personal_data/master/dooffy_design_icons_EU_flags_Poland.png" height="24"> Przydatne polecenia AT (Moja lista poleceń at dla modemów Quectel'a)
<details>
   <summary>Pokaż | Show me</summary>
   
``` bash
4x4/2x2 MIMO ON/OFF ➜ AT+QCFG="lte4x4mimo/disable",0;AT+QCFG="lte4x4mimo/disable",0
4x4/2x2 MIMO OFF/ON ➜ AT+QCFG="lte4x4mimo/disable",1;AT+QCFG="lte4x4mimo/disable",1
Disable Cell Lock ➜ AT+QNWLOCK="COMMON/4G",0;AT+QNWLOCK="COMMON/4G",0
Disable roaming immediately ➜ AT+QCFG="roamservice",1,1;AT+QCFG="roamservice",1,1
Enable roaming immediately ➜ AT+QCFG="roamservice",2,1;AT+QCFG="roamservice",2,1
Query ➜ AT+QNWLOCK="COMMON/4G";AT+QNWLOCK="COMMON/4G"
CellLock ➜ AT+QNWLOCK="COMMON/4G",NUM OF CELLS,FREQ,PCI;AT+QNWLOCK="COMMON/4G",1,
Check the signal info on each antenna port ➜ AT+QRSRP;AT+QRSRP
Query and Report Signal Strength ➜ AT+QCSQ;AT+QCSQ
Get the temperature of MT ➜ AT+QTEMP;AT+QTEMP
Check the firmware version ➜ AT+GMR;AT+GMR
Band Preferred ➜ AT+QNWPREFCFG="lte_band"?;AT+QNWPREFCFG="lte_band"?
Carrier Agregation Info ➜ AT+QCAINFO;AT+QCAINFO
Query the serving cell information ➜ AT+QENG="servingcell";AT+QENG="servingcell"
Query the information of neighbour cells ➜ AT+QENG="neighbourcell";AT+QENG="neighbourcell"
Query network information ➜ AT+QNWINFO;AT+QNWINFO
LTE Bands 1/3/7/8/20/38 ➜ AT+QNWPREFCFG="lte_band",1:3:7:8:20:38;AT+QNWPREFCFG="lte_band",1:3:7:8:20:38
5G SA Bands ➜ AT+QNWPREFCFG="nr5g_band",1:3:5:7:8:20:28:38:40:41:77:78:79;AT+QNWPREFCFG="nr5g_band",1:3:5:7:8:20:28:38:40:41:77:78:79
5G NSA Bands ➜ AT+QNWPREFCFG="nsa_nr5g_band",1:3:5:7:8:20:28:38:40:41:77:78:79;AT+QNWPREFCFG="nsa_nr5g_band",1:3:5:7:8:20:28:38:40:41:77:78:79
Disable 5G NR SA ➜ AT+QNWPREFCFG="nr5g_disable_mode",1;AT+QNWPREFCFG="nr5g_disable_mode",1
Disable 5G NR NSA ➜ AT+QNWPREFCFG="nr5g_disable_mode",2;AT+QNWPREFCFG="nr5g_disable_mode",2
Neither NSA & SA is disabled ➜ AT+QNWPREFCFG="nr5g_disable_mode",0;AT+QNWPREFCFG="nr5g_disable_mode",0
SIM Preferred Message Storage ➜ AT+CPMS="SM","SM","SM";AT+CPMS="SM","SM","SM"
Modem memory preferred Message Storage ➜ AT+CPMS="ME","ME","ME";AT+CPMS="ME","ME","ME"
Save SMS Settings ➜ AT+CSAS;AT+CSAS
Reboot the modem ➜ AT+CFUN=1,1;AT+CFUN=1,1
Reset the modem ➜ AT+CFUN=1;AT+CFUN=1
Reset modem to factory default ➜ AT+QPRTPARA=3;AT+QPRTPARA=3
Save NVM items through reset/reboot ➜ AT+QPRTPARA=1;AT+QPRTPARA=1
QMI/PPP/Default ➜ AT+QCFG="usbnet",0;AT+QCFG="usbnet",0
ECM ➜ AT+QCFG="usbnet",1;AT+QCFG="usbnet",1
MBIM ➜ AT+QCFG="usbnet",2;AT+QCFG="usbnet",2
Set RAT to 4G-LTE only ➜ AT+QNWPREFCFG="mode_pref",LTE;AT+QNWPREFCFG="mode_pref",LTE
Set RAT to LTE & 5G NR ➜ AT+QNWPREFCFG= "mode_pref",LTE:NR5G;AT+QNWPREFCFG= "mode_pref",LTE:NR5G
WCDMA only ➜ AT+QCFG="nwscanmode",2,1;AT+QCFG="nwscanmode",2,1
GSM only ➜ AT+QCFG="nwscanmode",1,1;AT+QCFG="nwscanmode",1,1
Scan all modes ➜ AT+QNWPREFCFG="mode_pref",AUTO;AT+QNWPREFCFG="mode_pref",AUTO
```

</details>
   
### <img src="https://raw.githubusercontent.com/4IceG/Personal_data/master/dooffy_design_icons_EU_flags_United_Kingdom.png" height="24"> Screenshots / <img src="https://raw.githubusercontent.com/4IceG/Personal_data/master/dooffy_design_icons_EU_flags_Poland.png" height="24"> Zrzuty ekranu

> "Received Messages" window / Okno odebranych wiadomości:

![](https://github.com/4IceG/Personal_data/blob/master/sms-tool-js/2.0.14-1.png?raw=true)

> "Sending Message" window / Okno wysyłania wiadomości:

![](https://github.com/4IceG/Personal_data/blob/master/sms-tool-js/2.0.8-2.PNG?raw=true)

> "USSD Codes" window / Okno kodów USSD:

![](https://github.com/4IceG/Personal_data/blob/master/sms-tool-js/2.0.8-3.png?raw=true)

> "AT Commands" window / Okno poleceń AT:

![](https://github.com/4IceG/Personal_data/blob/master/sms-tool-js/2.0.8-4.png?raw=true)

> "Configuration" window / Okno konfiguracji:

![](https://github.com/4IceG/Personal_data/blob/master/sms-tool-js/2.0.14-5.png?raw=true)
![](https://github.com/4IceG/Personal_data/blob/master/sms-tool-js/2.0.8-6.png?raw=true)
![](https://github.com/4IceG/Personal_data/blob/master/sms-tool-js/2.0.8-7.png?raw=true)
![](https://github.com/4IceG/Personal_data/blob/master/sms-tool-js/2.0.8-8.png?raw=true)

### <img src="https://raw.githubusercontent.com/4IceG/Personal_data/master/dooffy_design_icons_EU_flags_United_Kingdom.png" height="24"> Thanks to / <img src="https://raw.githubusercontent.com/4IceG/Personal_data/master/dooffy_design_icons_EU_flags_Poland.png" height="24"> Podziękowania dla
- [obsy (Cezary Jackiewicz)](https://github.com/obsy)
- [Users of the eko.one.pl forum](https://eko.one.pl/forum/viewtopic.php?id=20096)
