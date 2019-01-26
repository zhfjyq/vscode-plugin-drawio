# drawio for markdown

using drawio in markdown to edit svg...
you can auto sync you markdown svg to drawio in browser mode, and if you save a svg in chrome,it can auto save in you markdown asset.

in default ,you markdown drawio assets is save to same level dir for .md file ,dir name : drawio_assets
drawio will be launch chrome in standalone mode, it using .drawio-chrome dir in you workspace for save you chrome session.

using: Ctrl+P , select command: drawio to open chrome browser to edit svg

- in you markdown file edit window,move you cursor to line for \*.svg, and press Ctrl+P, drawio to launch chrome edit this drawio svg file.

```
    ![](drawio_assets/777.svg)
```

- you must install a chrome browser
- default using "offline" mode to open,so you can work in offline mode
- you drawio file name must as \*.svg, for auto save
