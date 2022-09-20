#sed -i '' 's/.css/.scss/g' src/badge.ts
#sed -i '' 's/{styles}/styles/g' src/badge.ts

# import {styles as sharedStyles} from './lib/shared-styles.scss';

#for dir in ${PWD}/src/@material/*/*; do
#    echo "$dir";
#done

for f in ${PWD}/src/@material/web/*/*; do
    echo "$f";
    sed -i '' 's/@material\/web\//..\//g' ${f}
done

# replace @material/web/ with ./../
for f in ${PWD}/src/@material/web/*/lib/*; do
    echo "$f";
    sed -i '' 's/@material\/web\//..\/..\//g' ${f}
done
for f in ${PWD}/src/@material/web/*/*; do
    echo "$f";
    sed -i '' 's/@material\/web\//..\//g' ${f}
done

# replace 'lit/decorators' with 'lit/decorators.js'
for f in ${PWD}/src/@material/web/*/lib/*.ts ${PWD}/src/@material/web/tabs/*/lib/*.ts; do
    echo "$f";
    sed -i '' "s/'lit\/decorators'/'lit\/decorators.js'/g" ${f}
    sed -i '' "s/'lit\/directives\/class-map'/'lit\/directives\/class-map.js'/g" ${f}
    sed -i '' "s/'lit\/directives\/if-defined'/'lit\/directives\/if-defined.js'/g" ${f}
done


# replace 'lit/decorators' with 'lit/decorators.js'
for f in ${PWD}/src/@material/web/*/*.ts ${PWD}/src/@material/web/tabs/*/*.ts; do
    echo "$f";
    sed -i '' "s/'lit\/decorators'/'lit\/decorators.js'/g" ${f}
    # replace .css with .scss
    sed -i '' "s/\.css'/\.scss'/g" ${f}
    # replace {styles} with styles
    sed -i '' 's/{styles}/styles/g' ${f}
    # replace {styles as elevatedStyles} with elevatedStyles
    sed -i '' 's/{styles as elevatedStyles}/elevatedStyles/g' ${f}
    # replace {styles as filledStyles} with filledStyles
    sed -i '' 's/{styles as filledStyles}/filledStyles/g' ${f}
    # replace {styles as sharedStyles} with sharedStyles
    sed -i '' 's/{styles as sharedStyles}/sharedStyles/g' ${f}
    # replace {styles as textStyles} with textStyles
    sed -i '' 's/{styles as textStyles}/textStyles/g' ${f}
    # replace {styles as outlinedStyles} with outlinedStyles
    sed -i '' 's/{styles as outlinedStyles}/outlinedStyles/g' ${f}
    # replace {styles as tonalStyles} with tonalStyles
    sed -i '' 's/{styles as tonalStyles}/tonalStyles/g' ${f}
    # replace {styles as fabStyles} with fabStyles
    sed -i '' 's/{styles as fabStyles}/fabStyles/g' ${f}
    # replace {styles as formfieldStyles} with formfieldStyles
    sed -i '' 's/{styles as formfieldStyles}/formfieldStyles/g' ${f}
    # replace {styles as primaryStyles} with primaryStyles
    sed -i '' 's/{styles as primaryStyles}/primaryStyles/g' ${f}
    # replace {styles as secondaryStyles}  with secondaryStyles
    sed -i '' 's/{styles as secondaryStyles}/secondaryStyles/g' ${f}
    # replace {styles as tabbarStyles} with tabbarStyles
    sed -i '' 's/{styles as tabbarStyles}/tabbarStyles/g' ${f}
    # replace {styles as filledForcedColorsStyles} with filledForcedColorsStyles
    sed -i '' 's/{styles as filledForcedColorsStyles}/filledForcedColorsStyles/g' ${f}
    # replace {styles as outlinedForcedColorsStyles}  with outlinedForcedColorsStyles
    sed -i '' 's/{styles as outlinedForcedColorsStyles}/outlinedForcedColorsStyles/g' ${f}
    # weird one
    sed -i '' 's/export {BeginPressConfig, EndPressConfig};/\/\/export {BeginPressConfig, EndPressConfig};/g' ${f}
done

