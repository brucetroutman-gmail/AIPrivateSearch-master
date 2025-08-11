#!/bin/bash
for file in *.pdf
do
    pdftotext "$file" "${file%.pdf}.txt"
done
