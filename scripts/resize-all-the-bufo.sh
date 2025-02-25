#! /bin/bash

for file in *.{png,gif}; do
    # If the file is a gif, resize the first frame to 64x64 and remove the original file, we can't mosaic gifs ...
    if [[ $file == *.gif ]]; then
        magick "$file[0]" -filter Mitchell -resize 64x64 -background none -gravity center -extent 64x64 "${file%.*}.png" && rm "$file"
        echo "Resized $file to ${file%.*}.png"
    else
        magick "$file" -filter Mitchell -resize 64x64 -background none -gravity center -extent 64x64 "$file"
        echo "Resized $file to $file"
    fi
done
