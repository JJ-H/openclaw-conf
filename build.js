#!/usr/bin/env node

/**
 * Build script to merge all slides into a single HTML file
 * 
 * Usage: node build.js
 * Output: dist/index.html (single file with all slides embedded)
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
    slidesDir: 'slides',
    sharedDir: 'shared',
    templateFile: 'index.html',
    outputDir: 'dist',
    outputFile: 'index.html'
};

function readFile(filePath) {
    return fs.readFileSync(filePath, 'utf-8');
}

function writeFile(filePath, content) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');
}

function getSlideFiles() {
    const files = fs.readdirSync(CONFIG.slidesDir)
        .filter(f => f.startsWith('slide-') && f.endsWith('.html'))
        .sort();
    return files;
}

function build() {
    console.log('🦞 Building OpenClaw Gitee Presentation...\n');
    
    // Read template
    console.log('📄 Reading template...');
    let template = readFile(CONFIG.templateFile);
    
    // Read shared styles
    console.log('🎨 Reading shared styles...');
    const styles = readFile(path.join(CONFIG.sharedDir, 'styles.css'));
    
    // Read shared scripts
    console.log('📜 Reading shared scripts...');
    const scripts = readFile(path.join(CONFIG.sharedDir, 'scripts.js'));
    
    // Read all slides
    console.log('📑 Reading slides...');
    const slideFiles = getSlideFiles();
    let slidesHtml = '';
    
    slideFiles.forEach((file, index) => {
        const slideContent = readFile(path.join(CONFIG.slidesDir, file));
        slidesHtml += slideContent + '\n';
        console.log(`   ✓ ${file}`);
    });
    
    // Replace external style link with inline styles
    console.log('\n🔧 Merging styles...');
    template = template.replace(
        '<link rel="stylesheet" href="shared/styles.css">',
        `<style>\n${styles}\n</style>`
    );
    
    // Replace external script src with inline scripts
    console.log('🔧 Merging scripts...');
    template = template.replace(
        '<script src="shared/scripts.js"></script>',
        `<script>\n${scripts}\n</script>`
    );
    
    // Replace dynamic loading with static slides
    console.log('🔧 Embedding slides...');
    
    // Find and replace the dynamic loading script block
    const scriptStart = template.indexOf('<script>\n        // Dynamically load all slides');
    if (scriptStart !== -1) {
        const scriptEnd = template.indexOf('</script>', scriptStart) + 9;
        const beforeScript = template.substring(0, scriptStart);
        const afterScript = template.substring(scriptEnd);
        
        const staticScript = `    <script>
        // Initialize presentation
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                window.presentation = new SlidePresentation();
                window.editor = new InlineEditor();
            });
        } else {
            window.presentation = new SlidePresentation();
            window.editor = new InlineEditor();
        }
    </script>`;
        
        template = beforeScript + staticScript + afterScript;
        console.log('   ✓ Replaced dynamic loading script');
    } else {
        console.log('   ⚠️  Dynamic loading script not found, skipping replacement');
    }
    
    slidesHtml = slidesHtml.replace(/src="assets\//g, 'src="assets/');
    slidesHtml = slidesHtml.replace(/url\(assets\//g, 'url(assets/');
    slidesHtml = slidesHtml.replace(/openLightbox\('assets\//g, "openLightbox('assets/");
    
    // Insert slides before the scripts
    template = template.replace(
        '<div id="slidesContainer"></div>',
        `<div id="slidesContainer">\n${slidesHtml}    </div>`
    );
    
    // Copy assets directory to dist
    console.log('📁 Copying assets...');
    const assetsSource = 'assets';
    const assetsDest = path.join(CONFIG.outputDir, 'assets');
    if (fs.existsSync(assetsSource)) {
        fs.mkdirSync(assetsDest, { recursive: true });
        const assetFiles = fs.readdirSync(assetsSource);
        assetFiles.forEach(file => {
            const srcPath = path.join(assetsSource, file);
            const destPath = path.join(assetsDest, file);
            fs.copyFileSync(srcPath, destPath);
            console.log(`   ✓ assets/${file}`);
        });
    }
    
    // Write output
    const outputPath = path.join(CONFIG.outputDir, CONFIG.outputFile);
    writeFile(outputPath, template);
    
    console.log(`\n✅ Build complete!`);
    console.log(`📦 Output: ${outputPath}`);
    console.log(`📊 Total slides: ${slideFiles.length}`);
    console.log(`📏 File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
    console.log(`\n🚀 Open ${outputPath} in your browser to view the presentation.`);
}

// Run build
try {
    build();
    process.exit(0);
} catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
}
