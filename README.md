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

#### Package dependencies for conventional modems.
Modem drivers are required for proper operation.
``` bash
opkg install kmod-usb-serial kmod-usb-serial-option sms-tool
```
The sms-tool package is available in the OpenWrt Master repository.

#### Step 1a. Install sms-tool from Master (Only the current snapshot image).
``` bash
opkg update
opkg install sms-tool
```

#### Step 1b. Download the sms-tool package and install manualy (For older stable version images).

   #### To install the sms-tool package, we need to know the architecture name for router.

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

#### Example of sms-tool installation using the command line.
> In the link below, replace ```*architecture*``` with the architecture of your router, e.g. arm_cortex-a7_neon-vfpv4, mipsel_24kc.

``` bash
wget https://downloads.openwrt.org/snapshots/packages/*architecture*/packages/sms-tool_2022-03-21-f07699ab-1_*architecture*.ipk -O /tmp/sms-tool_2022-03-21.ipk
opkg install /tmp/sms-tool_2022-03-21.ipk
```

#### Another way is to download the package manually.
> To do this, we go to the page.   
https://downloads.openwrt.org/snapshots/packages/

> We choose our architecture, e.g. arm_cortex-a7_neon-vfpv4, mipsel_24kc.   
https://downloads.openwrt.org/snapshots/packages/mipsel_24kc/

> Go to the "packages" folder.   
https://downloads.openwrt.org/snapshots/packages/mipsel_24kc/packages/

> Looking for "sms-tool_2022-03-21". We can use search by using Ctr + F and typing "sms-tool".
Save the package to your computer for further installation on the router.

#### Step 2. Add my repository (https://github.com/4IceG/Modem-extras) to the image and follow the commands.
``` bash
opkg update
opkg install luci-app-sms-tool-js
```

For images downloaded from eko.one.pl.
Installation procedure is similar, only there is no need to manually download the sms-tool package.

### <img src="https://raw.githubusercontent.com/4IceG/Personal_data/master/dooffy_design_icons_EU_flags_United_Kingdom.png" height="24"> User compilation / <img src="https://raw.githubusercontent.com/4IceG/Personal_data/master/dooffy_design_icons_EU_flags_Poland.png" height="24"> Kompilacja przez użytkownika
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

### <img src="https://raw.githubusercontent.com/4IceG/Personal_data/master/dooffy_design_icons_EU_flags_United_Kingdom.png" height="24"> Screenshots / <img src="https://raw.githubusercontent.com/4IceG/Personal_data/master/dooffy_design_icons_EU_flags_Poland.png" height="24"> Zrzuty ekranu

> "Received Messages" window / Okno odebranych wiadomości:

![](https://github.com/4IceG/Personal_data/blob/master/sms_tool_js/01b.png?raw=true)

> "Sending Message" window / Okno wysyłania wiadomości:

![](https://github.com/4IceG/Personal_data/blob/master/sms_tool_js/02.png?raw=true?raw=true)

> "USSD Codes" window / Okno kodów USSD:

![](https://github.com/4IceG/Personal_data/blob/master/sms_tool_js/03.png?raw=true?raw=true)

> "AT Commands" window / Okno poleceń AT:

![](https://github.com/4IceG/Personal_data/blob/master/sms_tool_js/04.png?raw=true?raw=true)

> "Configuration" window / Okno konfiguracji:

![](https://github.com/4IceG/Personal_data/blob/master/sms_tool_js/c01b.png?raw=true)
![](https://github.com/4IceG/Personal_data/blob/master/sms_tool_js/c02.png?raw=true?raw=true)
![](https://github.com/4IceG/Personal_data/blob/master/sms_tool_js/c03.png?raw=true?raw=true)
![](https://github.com/4IceG/Personal_data/blob/master/sms_tool_js/c04.png?raw=true)

### <img src="https://raw.githubusercontent.com/4IceG/Personal_data/master/dooffy_design_icons_EU_flags_United_Kingdom.png" height="24"> Thanks to / <img src="https://raw.githubusercontent.com/4IceG/Personal_data/master/dooffy_design_icons_EU_flags_Poland.png" height="24"> Podziękowania dla
- [obsy (Cezary Jackiewicz)](https://github.com/obsy)
- [eko.one.pl](https://eko.one.pl/forum/viewtopic.php?id=20096)
