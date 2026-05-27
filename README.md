### Install
`npm i -g github:mitchdzugan/yt_upload_playwright`

### Usage
```
yt_upload_playwright (OPTS*) (-f|--file)? file

  upload youtube videos through youtube studio UI via playwright 

Options

  -h, --help                 print this usage guide                             
  -l, --login                open a playwright session to login to your yt      
                             account, the window will close automatically after 
                             you login and land on yt studio page (does take    
                             second though)                                     
  -r, --rm-login             remove saved playwright login session              
  -s, --show                 show browser window instead of default headless    
  -j, --json file[]          path to json file(s) with preset options           
  -c, --channel string       channel to use                                     
  -t, --title string         video title                                        
  -d, --description string   video description                                  
  -i, --thumbnail file       path to video thumbnail image                      
  -v, --visibility string    PUBLIC | PRIVATE | UNLISTED                        
  -p, --playlist string[]    youtube ID (from URL) of playlist(s) to add video  
                             to                                                 
  -f, --file file            path to video that will be uploaded to youtube
```

