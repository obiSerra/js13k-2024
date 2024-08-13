#!/bin/bash


# Remove old submission zip
rm -f out/submission.zip

# Remove current build dir
rm -rf out/dist/*


node removeModules.js

chmod 777 out/dist/index_concat.ts
# prettier dist/index_concat.ts --write --config .prettierrc
echo "Manually fix the file out/dist/index_concat.ts [enter to continue]?"
read varname
cp src/index.ts src/index.ts.bak
cp out/dist/index_concat.ts src/index.ts

chown $USER_ID:$GROUP_ID src/index.ts


# Build with webpack
npm run dist


# Remove temporary files
mv src/index.ts.bak src/index.ts
rm -f index.ts.bak
rm -f index_concat.ts

# Create submission dir
cp -r out/dist/ out/submission/


# Perform any post-build steps here
#...

# Create the zip and remove the submission dir
zip -r out/submission.zip out/submission/
rm -rf out/submission/

echo ""
echo "Submission size:"
du -sh out/submission.zip