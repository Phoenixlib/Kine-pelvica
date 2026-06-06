// @ts-nocheck
const path = require('path');

module.exports = function (source) {
  if (source.includes('useEffectEvent')) {
    const polyfillPath = path.resolve(__dirname, '../src/sanity/useEffectEvent-polyfill').replace(/\\/g, '/');
    const esmRegex = /import\s+([^{]*)\{\s*([^}]+)\s*\}\s*from\s*['"]react['"]\s*;?/g;
    const cjsRegex = /(?:const|let|var)\s*\{([^}]*useEffectEvent[^}]*)\}\s*=\s*require\s*\(\s*['"]react['"]\s*\)\s*;?/g;
    
    let newSource = source;
    let modified = false;

    if (esmRegex.test(source)) {
      esmRegex.lastIndex = 0;
      newSource = newSource.replace(esmRegex, (match, defaultImport, namedImports) => {
        if (!namedImports.includes('useEffectEvent')) {
          return match;
        }
        modified = true;
        const cleaned = namedImports
          .replace(/\buseEffectEvent\s*,/g, '')
          .replace(/,\s*\buseEffectEvent\b/g, '')
          .replace(/\buseEffectEvent\b/g, '')
          .replace(/\s\s+/g, ' ')
          .trim();
        
        const defaultPart = defaultImport ? defaultImport.trim() : '';
        const namedPart = cleaned ? `{ ${cleaned} }` : '';
        
        let importStatement = 'import';
        if (defaultPart && namedPart) {
          importStatement += ` ${defaultPart} ${namedPart}`;
        } else if (defaultPart) {
          importStatement += ` ${defaultPart.replace(/,\s*$/, '')}`;
        } else if (namedPart) {
          importStatement += ` ${namedPart}`;
        } else {
          importStatement = '';
        }
        
        if (importStatement) {
          importStatement += ' from "react";';
        }
        
        const polyfillImport = `import { useEffectEvent } from "${polyfillPath}";`;
        return importStatement ? `${importStatement}\n${polyfillImport}` : polyfillImport;
      });
    }

    if (cjsRegex.test(newSource)) {
      cjsRegex.lastIndex = 0;
      newSource = newSource.replace(cjsRegex, (match, p1) => {
        modified = true;
        const cleaned = p1
          .replace(/\buseEffectEvent\s*,/g, '')
          .replace(/,\s*\buseEffectEvent\b/g, '')
          .replace(/\buseEffectEvent\b/g, '')
          .replace(/\s\s+/g, ' ')
          .trim();
        
        const namedPart = cleaned ? `{ ${cleaned} }` : '';
        const reactRequire = namedPart ? `const ${namedPart} = require("react");` : '';
        const polyfillRequire = `const { useEffectEvent } = require("${polyfillPath}");`;
        return reactRequire ? `${reactRequire}\n${polyfillRequire}` : polyfillRequire;
      });
    }

    if (modified) {
      return newSource;
    }
  }
  return source;
};
