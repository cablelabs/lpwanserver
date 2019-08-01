REST docs are generated from the source code using apiDoc.

Install apiDoc (may require sudo depending on your system setup):

    $ npm install apidoc -g

Update docs from the source.  Assume lpwanserver-site (this repo) and
lpwanserver (the source repo) are cloned at the same level.  From the
lpwanserver-site root directory:

    $  apidoc -i ../lpwanserver/rest/ -o static/rest/ -c static/rest/

    where
      - -i gives the input directory of the rest API source files
      - -o gives the output directory for the documentation
      - -c gives the location of the config file apidoc.json
      
