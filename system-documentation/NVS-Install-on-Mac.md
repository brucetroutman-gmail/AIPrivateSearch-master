Here’s a simplified guide to install NVS on a Mac using curl and assuming ~/.zshrc as the shell configuration file, followed by using nvs link 16 to set up Node.js version 16.
Steps to Install NVS and Use nvs link 16

Install NVS:

Open your terminal and run:
bashcurl -sSL https://raw.githubusercontent.com/jasongin/nvs/master/install.sh | bash
This downloads and installs NVS to ~/.nvs.


Set Up Environment Variables:

Add NVS to your ~/.zshrc by appending these lines:
bashecho 'export NVS_HOME="$HOME/.nvs"' >> ~/.zshrc
echo '[ -s "$NVS_HOME/nvs.sh" ] && . "$NVS_HOME/nvs.sh"' >> ~/.zshrc

Reload the shell configuration:
bashsource ~/.zshrc



Verify NVS Installation:

Check the NVS version:
bashnvs --version
You should see a version number (e.g., 1.7.1).


Install Node.js Version 16:

Add Node.js version 16:
bashnvs add 16



Link Node.js Version 16:

Link the latest Node.js 16.x.x version as the default:
bashnvs link node/16

Verify the linked version:
bashnode -v
It should output v16.x.x.



Notes

If nvs link node/16 fails, ensure version 16 is installed (nvs ls) or specify a precise version (e.g., nvs link node/16.20.2 after checking with nvs ls-remote node/16).
If nvs isn’t recognized, re-run source ~/.zshrc or check that the lines were added correctly to ~/.zshrc.
To unlink, use nvs unlink.

This is a minimal setup using curl and ~/.zshrc to get NVS running and link Node.js version 16. For more details, see https://github.com/jasongin/nvs.1.3sHow can Grok help?