
## Install NVS:

Open your terminal and run:

git clone https://github.com/jasongin/nvs.git ~/.nvs

This downloads and installs NVS to ~/.nvs.


## Set Up Environment Variables:

Add NVS to your ~/.zshrc by appending these lines:

export NVS_HOME="$HOME/.nvs"
export PATH="$NVS_HOME:$PATH"

Reload the shell configuration:
source ~/.zshrc

-AND-

Add NVS to your ~/.bash_profile by appending these lines:

export NVS_HOME="$HOME/.nvs"
export PATH="$NVS_HOME:$PATH"

Reload the shell configuration:
source ~/.bash_profile

## Verify NVS Installation:

Check the NVS version:
nvs --version
You should see a version number (e.g., 1.7.1).


## Install Node.js Version 22:

Add Node.js version 22:
nvs add 22

## Link Node.js Version 16:

Link the latest Node.js 16.x.x version as the default:
nvs link 22

Verify the linked version:
node -v
It should output v22.x.x.
