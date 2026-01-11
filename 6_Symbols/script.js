        // ==========================================
        // 1. DATA LOADING & INITIALIZATION
        // ==========================================
        let scenes = []; // Global variable to hold data after loading
        let projectVersion = 1;
        let lastUpdated = "";
        let currentSceneIndex = 0;
        let currentSelectedLineIndex = 0; // Track selected line within the scene


        function updateURL(index) {
            const url = new URL(window.location);
            url.searchParams.set('scene', index + 1);
            window.history.pushState({ sceneIndex: index }, '', url);
        }

        function nextScene() {
            if (currentSceneIndex < scenes.length - 1) {
                currentSceneIndex++;
                updateURL(currentSceneIndex);
                renderScenes();
                document.getElementById('app').scrollIntoView({ behavior: 'smooth' });
            }
        }

        let isMainContextCollapsed = true;

        function toggleSection(contentId, arrowId) {
            const content = document.getElementById(contentId);
            const arrow = document.getElementById(arrowId);
            
            if (content.classList.contains('hidden')) {
                content.classList.remove('hidden');
                if(arrow) arrow.classList.add('rotate-90');
            } else {
                content.classList.add('hidden');
                if(arrow) arrow.classList.remove('rotate-90');
            }
        }

        function toggleMainContext() {
            toggleSection('main-context-content', 'main-context-arrow');
        }

        function prevScene() {
            if (currentSceneIndex > 0) {
                currentSceneIndex--;
                updateURL(currentSceneIndex);
                renderScenes();
                document.getElementById('app').scrollIntoView({ behavior: 'smooth' });
            }
        }


        async function initApp() {
            // Restore API Key
            if (savedKey) {
                document.getElementById('apiKey').value = savedKey;
                verifyApiKey(savedKey);
            }

            // Restore ElevenLabs Key
            const savedElevenKey = localStorage.getItem('elevenlabs_api_key');
            if (savedElevenKey) {
                document.getElementById('elevenApiKey').value = savedElevenKey;
            }

            // Scroll Listener for "Scroll to Top"
            window.onscroll = function() {
                const btn = document.getElementById("scroll-top-btn");
                if (btn) {
                    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
                        btn.classList.add('visible');
                        btn.style.display = "block";
                        btn.style.visibility = "visible";
                        setTimeout(() => btn.style.opacity = "1", 10);
                    } else {
                        btn.style.opacity = "0";
                        setTimeout(() => {
                            btn.style.display = "none";
                            btn.style.visibility = "hidden";
                            btn.classList.remove('visible');
                        }, 300);
                    }
                }
            };

            // Handle Browser Back/Forward
            window.addEventListener('popstate', (event) => {
                if (event.state && typeof event.state.sceneIndex === 'number') {
                    currentSceneIndex = event.state.sceneIndex;
                } else {
                    // Fallback to URL or default
                    const urlParams = new URLSearchParams(window.location.search);
                    const sceneParam = urlParams.get('scene');
                    if (sceneParam) {
                       const index = parseInt(sceneParam) - 1;
                       if (index >= 0 && index < scenes.length) {
                           currentSceneIndex = index;
                       }
                    } else {
                        currentSceneIndex = 0;
                    }
                }
                renderScenes();
            });

            // Keyboard shortcuts for better UX
            document.addEventListener('keydown', (e) => {
                // Ctrl+S or Cmd+S to save
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    if (typeof saveChanges === 'function') {
                        saveChanges();
                    }
                }
                
                // Arrow keys for navigation (only when not in input/textarea)
                if (!['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                    if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        prevScene();
                    } else if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        nextScene();
                    }
                }
            });

            try {
                // Fetch the YAML file (Default load)
                await loadYAMLFromURL('scenes.yaml');
            } catch (error) {
                console.error("Error loading scenes:", error);
                logDebug("ERROR", "InitApp Failed", error.message);
            }
        }

        async function loadYAMLFromURL(url) {
            logDebug("INFO", "Fetching YAML", url);
            const response = await fetch(url);
            if (!response.ok) {
                const msg = `HTTP error! status: ${response.status}`;
                logDebug("ERROR", "YAML Fetch Failed", msg);
                throw new Error(msg);
            }
            const yamlText = await response.text();
            parseAndLoadData(yamlText);
        }

        async function handleOpenFile() {
            try {
                const [handle] = await window.showOpenFilePicker({
                    types: [{
                        description: 'YAML Files',
                        accept: { 'text/yaml': ['.yaml', '.yml'] },
                    }],
                    multiple: false
                });
                
                fileHandle = handle;
                const file = await fileHandle.getFile();
                const yamlText = await file.text();
                parseAndLoadData(yamlText);

                // Update UI to show we are in "Edit Mode"
                const notificationEl = document.getElementById('header-notification');
                notificationEl.innerText = `📂 Editing: ${file.name}`;
                notificationEl.classList.remove('opacity-0');
                
            } catch (err) {
                console.error('User cancelled or API not supported', err);
            }
        }

        function parseAndLoadData(yamlText) {
             if (typeof jsyaml === 'undefined') {
                 const msg = 'js-yaml library not loaded.';
                 console.error(msg);
                 logDebug("ERROR", "Dependency Error", msg);
                 alert('⚠️ YAML parser not loaded. Please check your internet connection.');
                 return;
             }

             let data;
             try {
                data = jsyaml.load(yamlText);
             } catch(e) {
                 logDebug("ERROR", "YAML Parse Error", e.message);
                 console.error(e);
                 return;
             }

             if (!data || !data.scenes) {
                 logDebug("ERROR", "Invalid YAML", "Missing 'scenes' property");
                 throw new Error("Invalid YAML format");
             }
             
             scenes = data.scenes;
             window.mainContext = data.main_context || "";
             window.verifiedMainContext = data.verified_main_context || false;
             window.projectTitle = data.title || "";
             projectVersion = data.version || 1;
             lastUpdated = data.last_updated || new Date().toISOString();

             // Update YAML Date Display
             const dateEl = document.getElementById('yaml-update-date');
             if (dateEl) {
                 try {
                     const date = new Date(lastUpdated);
                     const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                     dateEl.innerText = `📅 ${formattedDate}`;
                     
                     // Calculate relative time for tooltip
                     const now = new Date();
                     const diffMs = now - date;
                     const diffMins = Math.round(diffMs / 60000);
                     const diffHours = Math.round(diffMs / 3600000);
                     const diffDays = Math.round(diffMs / 86400000);

                     let relativeTimeStr = "";
                     if (diffMins < 1) {
                        relativeTimeStr = "Updated just now";
                     } else if (diffMins < 60) {
                        relativeTimeStr = `Updated ${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
                     } else if (diffHours < 24) {
                        relativeTimeStr = `Updated ${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
                     } else {
                         relativeTimeStr = `Updated ${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
                     }
                     
                     dateEl.title = relativeTimeStr;

                 } catch(e) {
                     console.error("Date format error", e);
                     dateEl.innerText = `📅 ${lastUpdated}`;
                     dateEl.title = "Date format error";
                 }
             }

             // Check URL for initial scene
             const urlParams = new URLSearchParams(window.location.search);
             const sceneParam = urlParams.get('scene');
             if (sceneParam) {
                 const index = parseInt(sceneParam) - 1;
                 if (index >= 0 && index < scenes.length) {
                     currentSceneIndex = index;
                 }
             }

             renderScenes();
             
             // Update Title Input
             const titleInput = document.getElementById('project-title-input');
             if(titleInput) titleInput.value = window.projectTitle || "";

             // Update history state for the initial load
             const url = new URL(window.location);
             url.searchParams.set('scene', currentSceneIndex + 1);
             window.history.replaceState({ sceneIndex: currentSceneIndex }, '', url);
        }

        function handleProjectTitleChange(val) {
             window.projectTitle = val;
        }

        let apiKeyDebounceTimer;
        function debouncedSaveApiKey(key) {
            clearTimeout(apiKeyDebounceTimer);
            saveApiKey(key); // Save immediately to local storage
            
            // Debounce verification
            const icon = document.getElementById('api-status-icon');
            icon.innerText = "⏳";
            
            apiKeyDebounceTimer = setTimeout(() => {
                verifyApiKey(key);
            }, 800);
        }

        function saveApiKey(key) {
            localStorage.setItem('google_api_key', key);
        }

        function saveElevenKey(key) {
            localStorage.setItem('elevenlabs_api_key', key);
        }

        async function verifyApiKey(key) {
            const icon = document.getElementById('api-status-icon');
            const input = document.getElementById('apiKey');
            const inputContainer = document.getElementById('api-key-input-container');
            const verifiedContainer = document.getElementById('api-key-verified');
            
            if (!key) {
                icon.innerText = "";
                input.classList.remove('border-green-500', 'border-red-500');
                // Ensure input is visible if empty? Or just stay as is.
                return;
            }

            try {
                // Lightweight call to list models to verify key
                const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=1`;
                const response = await fetch(url);
                
                if (response.ok) {
                    icon.innerText = "✅";
                    input.classList.add('border-green-500');
                    input.classList.remove('border-red-500');
                    
                    // Hide Input, Show Verified Badge
                    setTimeout(() => {
                        inputContainer.classList.add('hidden');
                        verifiedContainer.classList.remove('hidden');
                    }, 500); // Small delay to see the checkmark

                } else {
                    throw new Error("Invalid Key");
                }
            } catch (e) {
                icon.innerText = "❌";
                input.classList.add('border-red-500');
                input.classList.remove('border-green-500');
            }
        }

        function resetApiKey() {
            const inputContainer = document.getElementById('api-key-input-container');
            const verifiedContainer = document.getElementById('api-key-verified');
            const input = document.getElementById('apiKey');
            const icon = document.getElementById('api-status-icon');

            // Show Input
            verifiedContainer.classList.add('hidden');
            inputContainer.classList.remove('hidden');
            
            // Focus and Select
            input.focus();
            input.select();
        }
        
        function handleMainContextChange(value) {
            window.mainContext = value;
        }

        function handleMainContextVerify(checked) {
            window.verifiedMainContext = checked;
        }

        function handleSceneContextVerify(sceneIndex, checked) {
            scenes[sceneIndex].verified_context = checked;
        }

        function handleTransitionVerify(sceneIndex, checked) {
            scenes[sceneIndex].verified_transition = checked;
        }

        function handleTransitionChange(sceneIndex, value) {
            scenes[sceneIndex].transition = value;
        }

        function toggleFullScreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                });
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        }

        function toggleActionsMenu() {
            const menu = document.getElementById('actions-menu');
            const linksMenu = document.getElementById('links-menu');
            const symbolsMenu = document.getElementById('symbols-menu');
            
            // Close other menus
            if (linksMenu) {
                linksMenu.classList.add('hidden');
                linksMenu.classList.remove('flex');
            }
            if (symbolsMenu) {
                symbolsMenu.classList.add('hidden');
                symbolsMenu.classList.remove('flex');
            }

            // Toggle this menu
            menu.classList.toggle('hidden');
            menu.classList.toggle('flex');
        }

        function toggleLinksMenu() {
            const menu = document.getElementById('links-menu');
            const actionsMenu = document.getElementById('actions-menu');
            const symbolsMenu = document.getElementById('symbols-menu');
            
            // Close other menus
            if (actionsMenu) {
                actionsMenu.classList.add('hidden');
                actionsMenu.classList.remove('flex');
            }
            if (symbolsMenu) {
                symbolsMenu.classList.add('hidden');
                symbolsMenu.classList.remove('flex');
            }

            // Toggle this menu
            menu.classList.toggle('hidden');
            menu.classList.toggle('flex');
        }



        // Close menus when clicking outside
        document.addEventListener('click', function(event) {
            const actionsMenu = document.getElementById('actions-menu');
            const actionsBtn = document.getElementById('actions-menu-btn');
            
            const linksMenu = document.getElementById('links-menu');
            const linksBtn = document.getElementById('links-menu-btn');



            // Close Actions Menu
            if (actionsMenu && !actionsMenu.classList.contains('hidden')) {
                if (!actionsMenu.contains(event.target) && !actionsBtn.contains(event.target)) {
                    actionsMenu.classList.add('hidden');
                    actionsMenu.classList.remove('flex');
                }
            }

            // Close Links Menu
            if (linksMenu && !linksMenu.classList.contains('hidden')) {
                if (!linksMenu.contains(event.target) && !linksBtn.contains(event.target)) {
                    linksMenu.classList.add('hidden');
                    linksMenu.classList.remove('flex');
                }
            }

            // Close Doc Menus
            const docKeys = ['real', 'environment', 'ui', 'formulas', 'symbols', 'semblance', 'test'];
            docKeys.forEach(key => {
                const m = document.getElementById(`menu-list-${key}`);
                const b = document.getElementById(`menu-btn-${key}`);
                if (m && !m.classList.contains('hidden')) {
                    if (!m.contains(event.target) && !b.contains(event.target)) {
                         m.classList.add('hidden');
                         m.classList.remove('flex');
                    }
                }
            });
        });



        // ==========================================
        // TIMELINE HELPERS
        // ==========================================
        function parseDuration(timeStr) {
            if (!timeStr) return 0;
            const str = timeStr.toString().toLowerCase().trim();
            
            // Handle MM:SS or HH:MM:SS
            if (str.includes(':')) {
                const parts = str.split(':').map(p => parseFloat(p) || 0);
                if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
                if (parts.length === 2) return parts[0] * 60 + parts[1];
                return 0;
            }

            // Handle "2m 30s", "5m", "30s"
            if (str.includes('m') || str.includes('s')) {
                let total = 0;
                const matchM = str.match(/(\d+(\.\d+)?)m/);
                const matchS = str.match(/(\d+(\.\d+)?)s/);
                
                if (matchM) total += parseFloat(matchM[1]) * 60;
                if (matchS) total += parseFloat(matchS[1]);
                
                // If it has m/s but regex failed (edge cases), fallback to simple parse
                if (!matchM && !matchS) return parseFloat(str) || 0;
                
                return total;
            }

            // Fallback: simple float parsing
            const val = parseFloat(str);
            return isNaN(val) ? 0 : val;
        }

        function formatTimelineTime(totalSeconds) {
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = Math.floor(totalSeconds % 60);
            return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }

        // ==========================================
        // 2. RENDER UI
        // ==========================================
        
        function renderTabButton(uniqueId, type, label, model, isActive = false) {
            // ... (keep existing renderTabButton)
            const baseClasses = "px-3 py-2 text-xs font-bold transition-colors cursor-pointer border-b-2";
            const activeClasses = "text-blue-400 border-blue-400";
            const inactiveClasses = "text-gray-400 border-transparent hover:text-gray-200";

            return `
                <button type="button" 
                        id="tab-${uniqueId}-${type}" 
                        class="${baseClasses} ${isActive ? activeClasses : inactiveClasses}" 
                        data-model="${model}"
                        onclick="switchTab('${uniqueId}', '${type}')">
                    ${label}
                </button>
            `;
        }

        function selectLine(sceneIndex, lineIndex) {
            currentSelectedLineIndex = lineIndex;
            
            // 1. Visual Update (Toggle Classes) using DOM to avoid full re-render
            const allLines = document.querySelectorAll('.line-item-card');
            allLines.forEach(el => {
                el.classList.remove('border-blue-500', 'ring-1', 'ring-blue-500', 'bg-gray-800');
                el.classList.add('border-gray-800', 'bg-gray-900/50');
            });

            const selectedEl = document.getElementById(`line-card-s${sceneIndex}_l${lineIndex}`);
            if (selectedEl) {
                selectedEl.classList.remove('border-gray-800', 'bg-gray-900/50');
                selectedEl.classList.add('border-blue-500', 'ring-1', 'ring-blue-500', 'bg-gray-800');
            }

            // 2. Render Sidebar for this line
            renderSidebar(sceneIndex, lineIndex);
        }

        function renderSidebar(sceneIndex, lineIndex) {
            const container = document.getElementById('floating-assets-container');
            if (!container) return;

            const scene = scenes[sceneIndex];
            if (!scene || !scene.lines || !scene.lines[lineIndex]) {
                 container.innerHTML = '<div class="text-gray-500 text-xs italic p-2">No line selected</div>';
                 return;
            }

            const line = scene.lines[lineIndex];
            let html = `<h3 class="text-xs font-bold text-gray-400 mb-2 uppercase sticky top-0 bg-gray-900 pb-2 border-b border-gray-800 z-10 w-full">Line ${line.id} Assets</h3>`;

            if (line.uploaded_assets && Object.keys(line.uploaded_assets).length > 0) {
                 Object.entries(line.uploaded_assets).forEach(([type, asset]) => {
                    if (!asset || !asset.url) return;
                    
                    let embedUrl = asset.url;
                    const isDrive = asset.url.includes('drive.google.com');
                    if (isDrive && asset.url.includes('/view')) {
                        const idMatch = asset.url.match(/\/file\/d\/([^\/]+)/);
                        if (idMatch && idMatch[1]) {
                            embedUrl = `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w800`;
                        }
                    }

                    let contentHtml = '';
                    const typeLower = type.toLowerCase();
                    
                    const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(asset.filename) || typeLower === 'image';
                    const isAudio = /\.(mp3|wav|ogg)$/i.test(asset.filename) || typeLower === 'music' || typeLower === 'sound_effect';
                    const isVideo = /\.(mp4|webm)$/i.test(asset.filename) || typeLower === 'animation';
                    
                    if (isImage) {
                        contentHtml = `<img src="${embedUrl}" class="w-full h-auto rounded border border-gray-700 mt-1" alt="${type}" loading="lazy" onerror="this.style.display='none';">`;
                    } else if (isAudio) {
                        contentHtml = `<audio controls src="${embedUrl}" class="w-full h-8 mt-1"></audio>`;
                    } else if (isVideo) {
                        contentHtml = `<video controls src="${embedUrl}" class="w-full h-auto rounded border border-gray-700 mt-1"></video>`;
                    } else {
                        contentHtml = `<div class="p-2 bg-gray-800 rounded mt-1 text-center border border-gray-700">📄 File Preview</div>`;
                    }

                    html += `
                        <div class="bg-gray-900/50 p-2 rounded border border-gray-800 relative group hover:border-gray-600 transition-colors mb-2">
                            <div class="flex justify-between items-center mb-1">
                                <span class="text-[10px] uppercase text-blue-300 font-bold">${type}</span>
                                <a href="${asset.url}" target="_blank" class="text-gray-500 hover:text-white" title="Open in new tab">↗</a>
                            </div>
                            ${contentHtml}
                            <div class="mt-1">
                                <span class="text-[9px] text-gray-500 truncate block" title="${asset.filename}">${asset.filename}</span>
                            </div>
                        </div>
                    `;
                 });
            } else {
                html += '<div class="text-gray-600 text-xs italic p-2 text-center">No assets for this line</div>';
            }

            container.innerHTML = html;
        }

        function hideLine(sceneIndex, lineIndex) {
            const uniqueId = `s${sceneIndex}_l${lineIndex}`;
            const el = document.getElementById(`line-card-${uniqueId}`);
            if (el) {
                el.style.display = 'none';
            }
        }

        function renderScenes() {
            const app = document.getElementById('app');
            app.innerHTML = ''; // Clear loading state if any
            
            // Sidebar is now rendered via selectLine() called at the end

            if (scenes.length === 0) {
                 document.getElementById('nav-scene-indicator').innerText = "-- / --";
                 document.getElementById('nav-btn-prev').disabled = true;
                 document.getElementById('nav-btn-next').disabled = true;
                 return;
            }

            // Update Sticky Header Navigation
            document.getElementById('nav-scene-indicator').innerText = `Scene ${currentSceneIndex + 1} / ${scenes.length}`;
            document.getElementById('nav-btn-prev').disabled = (currentSceneIndex === 0);
            document.getElementById('nav-btn-next').disabled = (currentSceneIndex === scenes.length - 1);
            
            // Calculate Start Time for Current Scene
            let currentSceneTime = 0;
            for(let i=0; i < currentSceneIndex; i++) {
                if(scenes[i].lines) {
                    scenes[i].lines.forEach(l => {
                        currentSceneTime += parseDuration(l.time);
                    });
                }
            }

            // Render Main Context Input (Collapsible) - MOVED DOWN
            // This is now appended later
            const mainContextHtml = `
                <div class="bg-gray-800 rounded mb-4 border border-blue-900/50 shadow-lg relative overflow-hidden mt-6">
                    <div class="flex justify-between items-center p-2 bg-gray-800 cursor-pointer hover:bg-gray-700 transition" onclick="toggleMainContext()">
                        <div class="flex items-center gap-2">
                             <span id="main-context-arrow" class="text-gray-400 transform transition-transform ${isMainContextCollapsed ? '' : 'rotate-90'} text-xs">▶</span>
                             <label class="block text-xs font-bold text-blue-400 cursor-pointer">🌍 MAIN PROJECT CONTEXT (Globals)</label>
                        </div>
                        <label class="flex items-center gap-2 cursor-pointer" onclick="event.stopPropagation()">
                            <input type="checkbox" id="verify-main-context" 
                                onchange="handleMainContextVerify(this.checked)" 
                                ${window.verifiedMainContext ? 'checked' : ''}
                                class="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-0 scale-75">
                            <span class="text-[10px] text-blue-300">Verified</span>
                        </label>
                    </div>
                    
                    <div id="main-context-content" class="${isMainContextCollapsed ? 'hidden' : ''} p-2 border-t border-gray-700">
                        <textarea id="main-context" rows="2" 
                            class="w-full bg-black/50 text-gray-300 text-xs p-2 rounded border border-blue-900/30 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                            placeholder="Project context..."
                            oninput="handleMainContextChange(this.value)">${window.mainContext || ""}</textarea>
                    </div>
                </div>
            `;
            const mainContextDiv = document.createElement('div');
            mainContextDiv.innerHTML = mainContextHtml;
            // app.appendChild(mainContextDiv); // MOVED TO END of function

            const scene = scenes[currentSceneIndex];
            const sceneIndex = currentSceneIndex;
            
            const sceneContainer = document.createElement('div');
            sceneContainer.id = `scene-card-${sceneIndex}`;
            sceneContainer.className = `scene-card rounded-lg ${scene.color} overflow-hidden`;
                
                let html = `
                    <div class="flex justify-between items-center p-4 bg-[#252525] cursor-pointer hover:bg-[#2a2a2a] transition border-b border-gray-700" 
                         onclick="toggleScene(${sceneIndex})">
                        <div class="flex items-center gap-3">
                            <span id="chevron-${sceneIndex}" class="transform transition-transform rotate-0 text-gray-400">▼</span>
                            <h2 class="text-xl font-bold text-white">${scene.id}: ${scene.title}</h2>
                        </div>
                        <span class="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">${scene.lines.length} Lines</span>
                    </div>
                    
                    <div id="scene-content-${sceneIndex}" class="p-6 transition-all duration-300">
                        
                        <!-- Scene Context -->
                        <div class="mb-4">
                            <div class="bg-gray-900 rounded border border-gray-700 relative overflow-hidden">
                                <div class="flex justify-between items-center p-3 bg-gray-800 cursor-pointer hover:bg-gray-750 transition" 
                                     onclick="toggleSection('scene-context-content-${sceneIndex}', 'scene-context-arrow-${sceneIndex}')">
                                    <div class="flex items-center gap-2">
                                        <span id="scene-context-arrow-${sceneIndex}" class="text-gray-400 transform transition-transform text-xs">▶</span>
                                        <label class="block text-xs font-bold text-gray-400 cursor-pointer">SCENE CONTEXT</label>
                                    </div>
                                    <label class="flex items-center gap-2 cursor-pointer" onclick="event.stopPropagation()">
                                        <input type="checkbox" id="verify-context-${sceneIndex}" 
                                            onchange="handleSceneContextVerify(${sceneIndex}, this.checked)" 
                                            ${scene.verified_context ? 'checked' : ''}
                                            class="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-0 scale-75">
                                        <span class="text-[10px] text-gray-400">Verified</span>
                                    </label>
                                </div>
                                <div id="scene-context-content-${sceneIndex}" class="hidden p-2 border-t border-gray-700">
                                    <textarea id="context-${sceneIndex}" rows="2" 
                                        class="w-full bg-black/50 text-gray-300 text-sm p-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                                        placeholder="Mood, atmosphere, setting..."
                                        oninput="handleContextChange(${sceneIndex})">${scene.context || ""}</textarea>
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 gap-4">
                `;

            scene.lines.forEach((line, lineIndex) => {
                const uniqueId = `s${sceneIndex}_l${lineIndex}`;
                const currentPrompt = line.prompts ? line.prompts.image : "";
                
                // Calculate Timeline Position
                const startTime = formatTimelineTime(currentSceneTime);
                const duration = parseDuration(line.time);
                currentSceneTime += duration; // Accumulate for next line

                const isSelected = (lineIndex === currentSelectedLineIndex);
                const activeWrapperClass = isSelected ? "border-blue-500 ring-1 ring-blue-500 bg-gray-800" : "border-gray-800 bg-gray-900/50";

                html += `
                    <div id="line-card-${uniqueId}" 
                         class="line-item-card rounded border relative group hover:border-gray-600 transition-colors ${activeWrapperClass}"
                         onclick="selectLine(${sceneIndex}, ${lineIndex})">
                        <button onclick="hideLine(${sceneIndex}, ${lineIndex}); event.stopPropagation();" 
                            class="absolute top-1 right-1 text-gray-600 hover:text-red-500 z-20 p-1 rounded-full hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100" 
                            title="Hide Line">
                            ✕
                        </button>
                    <div class="flex justify-between items-start cursor-pointer p-2" onclick="event.stopPropagation(); toggleSection('line-tools-${uniqueId}', 'line-arrow-${uniqueId}'); selectLine(${sceneIndex}, ${lineIndex})">
                            <div class="flex gap-3 flex-1">
                                <span id="line-arrow-${uniqueId}" class="text-gray-500 transform transition-transform text-[10px] mt-1">▶</span>
                                <div class="flex-1">
                                    <div class="flex justify-between text-xs text-gray-400 mb-1">
                                        <div class="flex items-center gap-2">
                                            <span class="bg-gray-800 px-2 py-0.5 rounded text-gray-300">⏱️ ${line.time}</span>
                                            <span class="bg-blue-900/40 px-2 py-0.5 rounded text-blue-300 font-mono text-[10px]" title="Estimated Timeline Start">▶ ${startTime}</span>
                                        </div>
                                        <span class="font-mono">Line ${line.id}</span>
                                    </div>
                                    <div id="script-container-${uniqueId}">
                                        <!-- Display Mode -->
                                        <div id="script-display-${uniqueId}" class="group/script relative pl-2 border-l-2 border-gray-700 hover:border-blue-500 transition-colors">
                                            <p class="text-sm italic text-gray-300 whitespace-normal break-words hover:text-white transition-colors cursor-pointer" onclick="toggleScriptEdit('${uniqueId}', ${sceneIndex}, ${lineIndex})">"${line.script}"</p>
                                            <button onclick="toggleScriptEdit('${uniqueId}', ${sceneIndex}, ${lineIndex})" class="absolute top-0 right-0 opacity-0 group-hover/script:opacity-100 text-gray-500 hover:text-white transition-opacity p-1" title="Edit Voiceover">
                                                ✏️
                                            </button>
                                        </div>

                                        <!-- Edit Mode -->
                                        <div id="script-edit-${uniqueId}" class="hidden mt-1">
                                            <textarea id="script-input-${uniqueId}" rows="3" class="w-full bg-black/50 text-white p-2 text-sm rounded border border-blue-500 focus:outline-none mb-2 font-mono">${line.script}</textarea>
                                            <div class="flex justify-between items-center gap-2">
                                                <button id="regen-btn-${uniqueId}" onclick="regenerateScript('${uniqueId}', ${sceneIndex}, ${lineIndex})" class="text-xs bg-purple-900/50 hover:bg-purple-800 text-purple-300 px-2 py-1 rounded border border-purple-700/50 transition">✨ Regenerate</button>
                                                <div class="flex gap-2">
                                                    <button onclick="toggleScriptEdit('${uniqueId}', ${sceneIndex}, ${lineIndex})" class="text-xs text-gray-400 hover:text-white px-2 py-1">Cancel</button>
                                                    <button onclick="saveScriptUpdate('${uniqueId}', ${sceneIndex}, ${lineIndex})" class="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded font-bold">Save & Sync</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Uploaded Assets (Right Hand Side - Compact Links) -->
                            <div class="w-1/4 min-w-[150px] ml-4 pl-4 border-l border-gray-800 text-xs text-right">
                                <span class="font-bold text-gray-500 block mb-2 text-[10px] uppercase tracking-wider">Assets</span>
                                ${(() => {
                                    if (line.uploaded_assets && Object.keys(line.uploaded_assets).length > 0) {
                                        return Object.entries(line.uploaded_assets).map(([type, asset]) => {
                                            if (!asset || !asset.url) return '';
                                            
                                            const typeIcons = {
                                                'image': '🖼️',
                                                'music': '🎵',
                                                'sound_effect': '🔊',
                                                'animation': '🎬',
                                                'graphic': '📊',
                                                'motion_graphics': '✨'
                                            };
                                            const icon = typeIcons[type.toLowerCase()] || '📄';
                                            
                                            return `
                                                <div class="mb-1">
                                                    <a href="${asset.url}" target="_blank" class="text-blue-400 hover:text-white hover:underline truncate inline-flex items-center gap-1" title="${asset.filename}">
                                                       <span>${icon}</span>
                                                       <span class="truncate max-w-[100px]">${type} ↗</span>
                                                    </a>
                                                </div>
                                            `;
                                        }).join('');
                                    } else {
                                        return '<span class="text-gray-700 italic text-[10px]">-</span>';
                                    }
                                })()}
                            </div>
                        </div>
                            
                        <!-- Generate Sidebar Content -->
                        <!-- Logic Moved to renderSidebar() -->
                        <!-- Sidebar update triggered by selectLine() -->
                            
                            <!-- Prompt Controls (Collapsible) -->
                            <div id="line-tools-${uniqueId}" class="hidden mt-2 pt-2 border-t border-gray-800 px-2">
                                <div class="mb-3">
                                    <div class="flex border-b border-gray-700 mb-2 space-x-1 overflow-x-auto no-scrollbar">
                                        ${renderTabButton(uniqueId, 'image', '🖼️ Image', 'gemini-3-pro-image-preview', true)}
                                        ${renderTabButton(uniqueId, 'graphic', '📊 Graphic', 'gemini-3-pro-image-preview')}
                                        ${renderTabButton(uniqueId, 'music', '🎵 Music', 'eleven_turbo_v2')}
                                        ${renderTabButton(uniqueId, 'animation', '🎬 Animation', 'veo-2.0-generate-001')}
                                        ${renderTabButton(uniqueId, 'motion_graphics', '✨ Motion Graphics', 'gemini-2.0-flash')}
                                        ${renderTabButton(uniqueId, 'sound_effect', '🔊 SFX', 'eleven_turbo_v2_sfx')}
                                    </div>
                                    
                                    <div class="flex items-center gap-2 mb-2 px-1">
                                        <label class="flex items-center gap-2 cursor-pointer group-verify">
                                            <div class="relative">
                                                <input type="checkbox" id="verify-${uniqueId}" 
                                                    onchange="handleVerifyChange('${uniqueId}', ${sceneIndex}, ${lineIndex})" 
                                                    class="peer sr-only">
                                                <div class="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                                            </div>
                                            <span class="text-xs font-bold text-gray-500 peer-checked:text-green-400 transition-colors" id="verify-label-${uniqueId}">Verified for Bulk</span>
                                        </label>
                                    </div>
                                    
                                    <div class="relative">
                                        <textarea id="text-${uniqueId}" rows="3" 
                                                class="w-full bg-black/30 text-green-400 font-mono text-sm p-3 rounded border border-gray-700 focus:outline-none focus:border-green-500 resize-none pr-8 transition-colors"
                                                placeholder="Enter prompt here..."
                                                data-current-type="image"
                                                oninput="handleTextChange('${uniqueId}', ${sceneIndex}, ${lineIndex})">${currentPrompt}</textarea>
                                                
                                        <button onclick="downloadYAML()" 
                                                class="absolute top-2 right-20 text-gray-600 hover:text-white transition opacity-0 group-hover:opacity-100"
                                                title="Save Updates to YAML">
                                            <span class="text-lg">💾</span>
                                        </button>
                                        <button onclick="clearText('${uniqueId}', ${sceneIndex}, ${lineIndex})" 
                                                class="absolute top-2 right-11 text-gray-600 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                                                title="Clear Content">
                                            <span class="text-lg">🗑️</span>
                                        </button>
                                        <button onclick="copyToClipboard('${uniqueId}')" 
                                                class="absolute top-2 right-2 text-gray-600 hover:text-white transition opacity-0 group-hover:opacity-100"
                                                title="Copy to Clipboard">
                                            <span id="copy-text-${uniqueId}" class="text-lg">📋</span>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="flex justify-between items-center mt-3 pt-3 border-t border-gray-800">
                                    <div class="flex gap-2">
                                        <button onclick="handleGenerate('${uniqueId}')" 
                                            class="btn-gen text-white px-5 py-1.5 rounded shadow-lg shadow-blue-900/20 text-xs font-bold hover:brightness-110 flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95">
                                            <span>⚡ Generate Artifact</span>
                                            <div id="loader-${uniqueId}" class="loader"></div>
                                        </button>
                                        
                                        <button onclick="estimateCost('${uniqueId}')" 
                                            class="text-green-400 border border-green-800 bg-green-900/10 px-3 py-1.5 rounded text-xs font-bold hover:bg-green-900/30 transition-all"
                                            title="Estimate Cost for this generation">
                                            💰 Est. Cost
                                        </button>
                                    </div>

                                    <span id="status-${uniqueId}" class="text-xs font-mono"></span>
                                </div>
                                
                                <div id="result-container-${uniqueId}" class="mt-4 hidden p-3 bg-black rounded border border-gray-700 text-xs text-gray-300 font-mono overflow-auto max-h-[300px] whitespace-pre-wrap shadow-inner">
                                </div>
                            </div>
                    `;
                });

                html += `</div>`; // Close Lines Grid

                // Transition (moved to bottom)
                html += `
                    <div class="mt-4">
                        <div class="bg-gray-900 rounded border border-gray-700 relative overflow-hidden">
                            <div class="flex justify-between items-center p-3 bg-gray-800 cursor-pointer hover:bg-gray-750 transition"
                                 onclick="toggleSection('transition-content-${sceneIndex}', 'transition-arrow-${sceneIndex}')">
                                <div class="flex items-center gap-2">
                                    <span id="transition-arrow-${sceneIndex}" class="text-gray-400 transform transition-transform text-xs">▶</span>
                                    <label class="block text-xs font-bold text-gray-400 cursor-pointer">TRANSITION (to next scene)</label>
                                </div>
                                <label class="flex items-center gap-2 cursor-pointer" onclick="event.stopPropagation()">
                                    <input type="checkbox" id="verify-transition-${sceneIndex}" 
                                        onchange="handleTransitionVerify(${sceneIndex}, this.checked)" 
                                        ${scene.verified_transition ? 'checked' : ''}
                                        class="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-0 scale-75">
                                    <span class="text-[10px] text-gray-400">Verified</span>
                                </label>
                            </div>
                            <div id="transition-content-${sceneIndex}" class="hidden p-2 border-t border-gray-700">
                                <textarea id="transition-${sceneIndex}" rows="2" 
                                    class="w-full bg-black/50 text-gray-300 text-sm p-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="How does this scene end? Cut to black? Fade out?"
                                    oninput="handleTransitionChange(${sceneIndex}, this.value)">${scene.transition || ""}</textarea>
                            </div>
                        </div>
                    </div>
                `;

                html += `</div></div>`; // Close scene-content and scene-card
                sceneContainer.innerHTML = html;
                app.appendChild(sceneContainer);

                // Append Main Context at the BOTTOM
                app.appendChild(mainContextDiv);
                
                // Initial Sidebar Render
                if (scenes.length > 0 && scenes[currentSceneIndex].lines.length > 0) {
                     // Ensure valid index
                     if(currentSelectedLineIndex >= scenes[currentSceneIndex].lines.length) {
                         currentSelectedLineIndex = 0;
                     }
                     renderSidebar(currentSceneIndex, currentSelectedLineIndex);
                } else {
                    document.getElementById('floating-assets-container').innerHTML = '';
                }
        }

        // ==========================================
        // 3. UI INTERACTIONS
        // ==========================================
        
        function handleContextChange(sceneIndex) {
            const textArea = document.getElementById(`context-${sceneIndex}`);
            scenes[sceneIndex].context = textArea.value;
        }

        function toggleScriptEdit(uniqueId, sceneIndex, lineIndex) {
            // Prevent event bubbling if triggered from multiple places
            if (event) event.stopPropagation();
            
            const displayEl = document.getElementById(`script-display-${uniqueId}`);
            const editEl = document.getElementById(`script-edit-${uniqueId}`);
            const inputEl = document.getElementById(`script-input-${uniqueId}`);
            
            if (editEl.classList.contains('hidden')) {
                // Switch to Edit Mode
                displayEl.classList.add('hidden');
                editEl.classList.remove('hidden');
                inputEl.focus();
            } else {
                // Switch to Display Mode (Cancel)
                displayEl.classList.remove('hidden');
                editEl.classList.add('hidden');
                // Reset value to current state
                inputEl.value = scenes[sceneIndex].lines[lineIndex].script;
            }
        }

        async function saveScriptUpdate(uniqueId, sceneIndex, lineIndex) {
            if (event) event.stopPropagation();
            
            const inputEl = document.getElementById(`script-input-${uniqueId}`);
            const newScript = inputEl.value;
            
            // 1. Update Local Data
            scenes[sceneIndex].lines[lineIndex].script = newScript;
            
            // 2. Optimistic UI Update (Switch back to display mode with new text)
            const displayEl = document.getElementById(`script-display-${uniqueId}`);
            const editEl = document.getElementById(`script-edit-${uniqueId}`);
            
            // Update the display paragraph
            const pObj = displayEl.querySelector('p');
            if (pObj) pObj.innerText = `"${newScript}"`;
            
            displayEl.classList.remove('hidden');
            editEl.classList.add('hidden');
            
            // 3. Trigger Save to GitHub
            // skipConfirm = true for smoother UX
            await saveChanges(true);
        }

        async function regenerateScript(uniqueId, sceneIndex, lineIndex) {
            const apiKey = document.getElementById('apiKey').value;
            if (!apiKey) {
                alert("⚠️ Please paste your Google API Key at the top first.");
                return;
            }

            const inputEl = document.getElementById(`script-input-${uniqueId}`);
            const originalScript = inputEl.value;
            if (!originalScript) return;

            const btn = document.getElementById(`regen-btn-${uniqueId}`);
            const originalBtnText = btn.innerHTML;
            
            btn.innerHTML = "✨ ...";
            btn.disabled = true;

            // Construct Prompt
            const sceneCtx = scenes[sceneIndex].context || "";
            const mainCtx = window.mainContext || "";
            
            const systemInstruction = "You are a professional script writer/editor. Your task is to rewrite the provided voiceover line to be more engaging, clear, and impactful, while maintaining the original meaning and intended mood. Output ONLY the improved script line, no explanations. Do not include quotes.";
            
            const contextBlock = `
            Project Context: ${mainCtx}
            Scene Context: ${sceneCtx}
            `;

            const userPrompt = `
            ${contextBlock}
            
            Original Line: "${originalScript}"
            
            Improved Line:
            `;

            const modelId = "gemini-2.0-flash";
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;

            const payload = {
                contents: [{
                    role: "user",
                    parts: [{ text: `SYSTEM: ${systemInstruction}\n\nUSER PROMPT: ${userPrompt}` }]
                }]
            };

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();
                
                if (!response.ok) throw new Error(data.error?.message || `API Error: ${response.status}`);

                if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    const newText = data.candidates[0].content.parts[0].text.trim();
                    inputEl.value = newText;
                    
                    // Visual feedback
                    inputEl.classList.add('border-green-500');
                    setTimeout(() => inputEl.classList.remove('border-green-500'), 1000);
                } else {
                    throw new Error("No content generated");
                }

            } catch (error) {
                console.error("Regenerate failed:", error);
                alert(`Regeneration failed: ${error.message}`);
            } finally {
                btn.innerHTML = originalBtnText;
                btn.disabled = false;
            }
        }


        function openScriptModal() {
            const modal = document.getElementById('script-modal');
            modal.classList.remove('hidden');
            renderScriptContent();
        }

        function renderScriptContent() {
            const textarea = document.getElementById('full-script-content');
            const isClean = document.getElementById('clean-script-toggle').checked;
            
            let fullScript = "";
            
            scenes.forEach(scene => {
                if (!isClean) {
                    fullScript += `### ${scene.id}: ${scene.title}\n`;
                }
                
                if(scene.lines) {
                    scene.lines.forEach(line => {
                        if (isClean) {
                            // Clean view: Just the script
                            if (line.script) fullScript += `${line.script}\n`;
                        } else {
                            // Full view: Timecode + Script
                            fullScript += `[${line.time}] ${line.script}\n`;
                        }
                    });
                }
                fullScript += `\n`; // Add spacing between scenes
            });
            
            textarea.value = fullScript;
        }

        function closeScriptModal() {
            document.getElementById('script-modal').classList.add('hidden');
        }

        function copyScriptToClipboard(btn) {
            const textarea = document.getElementById('full-script-content');
            textarea.select();
            document.execCommand('copy'); 
            
            const originalText = btn.innerText;
            btn.innerText = "✅ Copied!";
            setTimeout(() => btn.innerText = originalText, 2000);
        }

        function openYamlModal() {
            const modal = document.getElementById('yaml-modal');
            modal.classList.remove('hidden');
            renderYamlContent();
        }

        function renderYamlContent() {
            const textarea = document.getElementById('full-yaml-content');
            try {
                // Reconstruct the full object structure
                // Reconstruct the full object structure
                const data = {
                    title: window.projectTitle || "",
                    main_context: window.mainContext,
                    verified_main_context: window.verifiedMainContext,
                    scenes: scenes
                };
                // Dump to YAML
                const yamlString = jsyaml.dump(data, { indent: 2, lineWidth: -1 });
                textarea.value = yamlString;
            } catch (e) {
                console.error("YAML Dump Error:", e);
                textarea.value = "Error generating YAML: " + e.message;
            }
        }

        function closeYamlModal() {
            document.getElementById('yaml-modal').classList.add('hidden');
        }

        function copyYamlToClipboard(btn) {
            const textarea = document.getElementById('full-yaml-content');
            textarea.select();
            document.execCommand('copy'); 
            
            const originalText = btn.innerText;
            btn.innerText = "✅ Copied!";
            setTimeout(() => btn.innerText = originalText, 2000);
        }

        function openStatsModal() {
            let totalScenes = scenes.length;
            let totalLines = 0;
            let totalPrompts = 0;
            let totalSeconds = 0;
            let totalWords = 0;
            let totalSentences = 0;
            
            // Verification Stats
            let verifiedContexts = 0;
            let verifiedTransitions = 0;
            let totalVerifiedPrompts = 0;
            let verifiedByType = {
                image: 0,
                graphic: 0,
                music: 0,
                animation: 0,
                motion_graphics: 0,
                sound_effect: 0
            };

            scenes.forEach(scene => {
                // Scene Verification
                if (scene.verified_context) verifiedContexts++;
                if (scene.verified_transition) verifiedTransitions++;
                
                if (scene.lines) {
                    totalLines += scene.lines.length;
                    scene.lines.forEach(line => {
                         // Count prompts
                         if(line.prompts) {
                             Object.values(line.prompts).forEach(val => {
                                 if(val && val.trim() !== "") totalPrompts++;
                             });
                         }
                         
                         // Count Verification
                         if(line.verified_prompts) {
                             Object.entries(line.verified_prompts).forEach(([type, isVerified]) => {
                                 if(isVerified) {
                                     totalVerifiedPrompts++;
                                     if(verifiedByType[type] !== undefined) {
                                         verifiedByType[type]++;
                                     }
                                 }
                             });
                         }

                         if (line.script) {
                             const scriptText = line.script.trim();
                             if (scriptText) {
                                // Word count
                                const words = scriptText.split(/\s+/);
                                const wordCount = words.length;
                                totalWords += wordCount;
                                totalSeconds += wordCount / 2; // Duration: 2 words = 1 second

                                // Sentence count (split by punctuation)
                                const sentences = scriptText.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
                                if (sentences) {
                                    totalSentences += sentences.length;
                                }
                             }
                         }
                    });
                }
            });

            // Format Duration
            totalSeconds = Math.ceil(totalSeconds);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            
            const timeString = `${hours > 0 ? String(hours).padStart(2, '0') + ':' : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

            // Update General Stats
            document.getElementById('stat-scenes').innerText = totalScenes;
            document.getElementById('stat-lines').innerText = totalLines;
            document.getElementById('stat-prompts').innerText = totalPrompts;
            document.getElementById('stat-duration').innerText = timeString;
            document.getElementById('stat-words').innerText = totalWords;
            document.getElementById('stat-sentences').innerText = totalSentences;

            // Update Verified Stats
            document.getElementById('stat-verified-total').innerText = totalVerifiedPrompts;
            document.getElementById('stat-verified-context').innerText = verifiedContexts;
            document.getElementById('stat-verified-transition').innerText = verifiedTransitions;

            const breakdownContainer = document.getElementById('verified-breakdown');
            breakdownContainer.innerHTML = '';
            
            const typeLabels = {
                image: 'Image',
                graphic: 'Graphic',
                music: 'Music',
                animation: 'Animation',
                motion_graphics: 'Motion Gfx',
                sound_effect: 'SFX'
            };

            for (const [type, count] of Object.entries(verifiedByType)) {
                const div = document.createElement('div');
                div.className = "flex justify-between items-center border-b border-gray-700 pb-1";
                div.innerHTML = `
                    <span class="text-gray-400">${typeLabels[type] || type}</span>
                    <span class="font-mono text-white font-bold">${count}</span>
                `;
                breakdownContainer.appendChild(div);
            }

            document.getElementById('stats-modal').classList.remove('hidden');
        }

        function closeStatsModal() {
            document.getElementById('stats-modal').classList.add('hidden');
        }
        
        function toggleScene(index) {
            const content = document.getElementById(`scene-content-${index}`);
            const chevron = document.getElementById(`chevron-${index}`);
            
            if (content.classList.contains('hidden')) {
                content.classList.remove('hidden');
                chevron.classList.remove('-rotate-90');
                chevron.classList.add('rotate-0');
            } else {
                content.classList.add('hidden');
                chevron.classList.remove('rotate-0');
                chevron.classList.add('-rotate-90');
            }
        }
        
        // Timer for notification
        let notifyTimeout;

        function switchTab(uniqueId, type) {
            const activeClasses = ['text-blue-400', 'border-blue-400'];
            const inactiveClasses = ['text-gray-400', 'border-transparent', 'hover:text-gray-200'];

            // Update UI Tabs
            const buttons = document.querySelectorAll(`[id^="tab-${uniqueId}-"]`);
            buttons.forEach(btn => {
                btn.classList.remove(...activeClasses);
                btn.classList.add(...inactiveClasses);
            });
            const activeBtn = document.getElementById(`tab-${uniqueId}-${type}`);
            activeBtn.classList.remove(...inactiveClasses);
            activeBtn.classList.add(...activeClasses);
            
            // Notification in Header
            const modelName = activeBtn.getAttribute('data-model');
            const notificationEl = document.getElementById('header-notification');
            if (modelName && notificationEl) {
                notificationEl.innerText = `Using Model: ${modelName}`;
                notificationEl.classList.remove('opacity-0');
                
                // Clear previous timeout if exists
                if (notifyTimeout) clearTimeout(notifyTimeout);
                
                // Hide after 3 seconds
                notifyTimeout = setTimeout(() => {
                    notificationEl.classList.add('opacity-0');
                }, 3000);
            }

            // Update Textarea
            // uniqueId format: s{sceneIndex}_l{lineIndex}
            const parts = uniqueId.split('_'); 
            // parts[0] is s{sceneIndex}, parts[1] is l{lineIndex}
            const sceneIndex = parseInt(parts[0].substring(1));
            const lineIndex = parseInt(parts[1].substring(1));
            
            const textArea = document.getElementById(`text-${uniqueId}`);
            
            // Get content from data model
            // Ensure prompts object exists
            if (!scenes[sceneIndex].lines[lineIndex].prompts) {
                scenes[sceneIndex].lines[lineIndex].prompts = {};
            }
            const promptContent = scenes[sceneIndex].lines[lineIndex].prompts[type] || "";
            textArea.value = promptContent;
            
            // Update data attribute for handleTextChange
            textArea.setAttribute('data-current-type', type);

            // Update Verified Toggle
            updateVerifiedToggleOnly(uniqueId, sceneIndex, lineIndex, type);
        }

        function updateVerifiedToggleOnly(uniqueId, sceneIndex, lineIndex, type) {
            const verifyCheckbox = document.getElementById(`verify-${uniqueId}`);
            const verifyLabel = document.getElementById(`verify-label-${uniqueId}`);
            
            // Check data model
            const verifiedMap = scenes[sceneIndex].lines[lineIndex].verified_prompts || {};
            const isVerified = verifiedMap[type] === true;
            
            verifyCheckbox.checked = isVerified;
            if (isVerified) {
                verifyLabel.innerText = "Verified for Bulk ✅";
                verifyLabel.classList.add('text-green-400');
            } else {
                verifyLabel.innerText = "Verify for Bulk";
                verifyLabel.classList.remove('text-green-400');
            }
        }

        function handleVerifyChange(uniqueId, sceneIndex, lineIndex) {
            const checkbox = document.getElementById(`verify-${uniqueId}`);
            const textArea = document.getElementById(`text-${uniqueId}`);
            const type = textArea.getAttribute('data-current-type');
            
            if (!scenes[sceneIndex].lines[lineIndex].verified_prompts) {
                scenes[sceneIndex].lines[lineIndex].verified_prompts = {};
            }
            
            scenes[sceneIndex].lines[lineIndex].verified_prompts[type] = checkbox.checked;
            
            // Update label immediately
             const verifyLabel = document.getElementById(`verify-label-${uniqueId}`);
             if (checkbox.checked) {
                verifyLabel.innerText = "Verified for Bulk ✅";
                verifyLabel.classList.add('text-green-400');
            } else {
                verifyLabel.innerText = "Verify for Bulk";
                verifyLabel.classList.remove('text-green-400');
            }
        }

        function handleTextChange(uniqueId, sceneIndex, lineIndex) {
            const textArea = document.getElementById(`text-${uniqueId}`);
            const type = textArea.getAttribute('data-current-type');
            
            if (!scenes[sceneIndex].lines[lineIndex].prompts) {
                scenes[sceneIndex].lines[lineIndex].prompts = {};
            }
            
            // Update Data Model
            scenes[sceneIndex].lines[lineIndex].prompts[type] = textArea.value;
        }

        function copyToClipboard(uniqueId) {
            const textArea = document.getElementById(`text-${uniqueId}`);
            const copyTextSpan = document.getElementById(`copy-text-${uniqueId}`);
            
            textArea.select();
            textArea.setSelectionRange(0, 99999); // For mobile devices
            
            navigator.clipboard.writeText(textArea.value).then(() => {
                const originalText = copyTextSpan.innerText;
                copyTextSpan.innerText = "Copied!";
                setTimeout(() => {
                    copyTextSpan.innerText = "📋";
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        }

        function clearText(uniqueId, sceneIndex, lineIndex) {
            const textArea = document.getElementById(`text-${uniqueId}`);
            const type = textArea.getAttribute('data-current-type');
            
            if (confirm("Are you sure you want to clear this prompt?")) {
                textArea.value = "";
                
                // Update Data Model
                if (!scenes[sceneIndex].lines[lineIndex].prompts) {
                    scenes[sceneIndex].lines[lineIndex].prompts = {};
                }
                scenes[sceneIndex].lines[lineIndex].prompts[type] = "";
            }
        }

        // ==========================================
        // 3.5 CONTEXT MODAL LOGIC
        // ==========================================
        
        let pendingGeneration = null;

        function openContextModal(uniqueId, action = 'generate') {
            const textArea = document.getElementById(`text-${uniqueId}`);
            // Default to 'image' if not set
            const type = textArea.getAttribute('data-current-type') || 'image'; 
            let promptText = textArea.value;

            // 1. Get IDs
            const parts = uniqueId.split('_'); 
            const sceneIndex = parseInt(parts[0].substring(1));
            
            // 2. Gather Contexts
            const mainCtx = window.mainContext || "";
            const sceneCtx = scenes[sceneIndex].context || "";
            const transitionCtx = scenes[sceneIndex].transition || "";

            // 3. Construct Context Block
            const finalPrompt = constructFullPrompt(sceneIndex, promptText, type);

            // 4. Populate Modal
            document.getElementById('preview-main-context').value = mainCtx || "(No Main Context)";
            document.getElementById('preview-scene-context').value = sceneCtx || "(No Scene Context)";
            document.getElementById('preview-transition-context').value = transitionCtx || "(No Transition)";
            document.getElementById('preview-final-prompt').value = finalPrompt;

            // 5. Store State
            pendingGeneration = {
                uniqueId: uniqueId,
                finalPrompt: finalPrompt,
                type: type,
                action: action
            };

            // 6. Show Modal
            document.getElementById('context-preview-modal').classList.remove('hidden');
        }

        function closeContextModal() {
            document.getElementById('context-preview-modal').classList.add('hidden');
            pendingGeneration = null;
        }

        function confirmGeneration() {
            if (!pendingGeneration) return;
            
            const { uniqueId, type, action } = pendingGeneration;
            
            // Read the final prompt directly from the textarea to allow for manual edits
            const finalPrompt = document.getElementById('preview-final-prompt').value;
            closeContextModal();

            if (type === 'image' || type === 'graphic') {
                generateMultimodalContent(uniqueId, finalPrompt, action);
            } else if (type === 'animation') {
                generateVideoContent(uniqueId, finalPrompt, action);
            } else if (type === 'music' || type === 'sound_effect') {
                generateAudioContent(uniqueId, finalPrompt, action);
            } else {
                generateContent(uniqueId, finalPrompt);
            }
        }

        function handleGenerate(uniqueId, action = 'generate') {
            openContextModal(uniqueId, action);
        }

        function toggleDebug() {
            const panel = document.getElementById('debug-panel');
            const isHidden = panel.classList.contains('translate-y-[calc(100%)]');
            if (isHidden) {
                panel.classList.remove('translate-y-[calc(100%)]');
            } else {
                panel.classList.add('translate-y-[calc(100%)]');
            }
        }

        function toggleDebugHeight() {
            const panel = document.getElementById('debug-panel');
            const btn = document.getElementById('debug-maximize-btn');
            const isTall = panel.classList.contains('h-[80vh]');
            
            if (isTall) {
                panel.classList.remove('h-[80vh]');
                panel.classList.add('h-48');
                if(btn) {
                    btn.innerText = "⛶";
                    btn.title = "Maximize";
                }
            } else {
                panel.classList.remove('h-48');
                panel.classList.add('h-[80vh]');
                if(btn) {
                    btn.innerText = "_";
                    btn.title = "Minimize";
                }
            }
        }

        function clearDebugLog() {
            const logContainer = document.getElementById('debug-log');
            if (logContainer) {
                logContainer.innerHTML = '<div class="text-gray-500 italic">-- Log Cleared --</div>';
            }
        }

        function logDebug(type, title, data) {
            const logContainer = document.getElementById('debug-log');
            const entry = document.createElement('div');
            entry.className = `border-l-2 ${type === 'INFO' ? 'border-blue-500' : type === 'ERROR' ? 'border-red-500' : 'border-yellow-500'} pl-2 mb-2`;
            entry.innerHTML = `
                <div class="flex justify-between">
                    <span class="font-bold text-gray-400">${type}</span>
                    <span class="text-gray-600">${new Date().toLocaleTimeString()}</span>
                </div>
                <div class="font-bold text-white">${title}</div>
                <div class="break-all whitespace-pre-wrap">${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}</div>
            `;
            logContainer.prepend(entry);
        }

        function toggleAudioPlayer() {
            // Feature disabled in new minimal design
            console.log("Audio player toggle disabled");
        }
        
        // Initialize state
        document.addEventListener('DOMContentLoaded', () => {
             // No initialization needed for fixed player
             initDocumentationMenus();
        });


        // ==========================================
        // 4. API CALL LOGIC
        // ==========================================
        
        // 4a. Text-Only Generation
        async function generateContent(id, prompt) {
            const apiKey = document.getElementById('apiKey').value;
            if (!apiKey) {
                alert("⚠️ Please paste your Google API Key at the top first.");
                return;
            }

            const loader = document.getElementById(`loader-${id}`);
            const status = document.getElementById(`status-${id}`);
            const container = document.getElementById(`result-container-${id}`);

            loader.style.display = "block";
            status.innerText = "Thinking...";
            status.className = "text-xs text-blue-400";
            container.classList.add('hidden');

            const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
            const payload = {
                contents: [{ parts: [{ text: prompt }] }]
            };

            logDebug('REQ', 'Sending Text Request', { url, payload });

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
                    body: JSON.stringify(payload)
                });
                
                const data = await response.json();
                logDebug('RES', `Response (${response.status})`, data);

                if (!response.ok) throw new Error(data.error?.message || `API Error: ${response.status}`);
                
                if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    const text = data.candidates[0].content.parts[0].text;
                    const requestId = response.headers.get('x-goog-request-id');
                    const logUrl = requestId ? `https://aistudio.google.com/logs/${requestId}` : "https://aistudio.google.com/logs";
                    const logLink = `<div class="mt-4 pt-2 border-t border-gray-700"><a href="${logUrl}" target="_blank" class="text-xs text-gray-500 hover:text-blue-400">View Logs ↗</a></div>`;
                    container.innerHTML = `<div class="whitespace-pre-wrap">${text}</div>${logLink}`;
                    container.classList.remove('hidden');
                    status.innerText = "✅ Done";
                    status.className = "text-xs text-green-500";
                } else {
                    throw new Error("Unexpected response format");
                }
            } catch (error) {
                console.error(error);
                logDebug('ERROR', error.message, error);
                status.innerText = "❌ Failed";
                status.className = "text-xs text-red-500";
                container.innerHTML = `<span class="text-red-400">Error: ${error.message}</span>`;
                container.classList.remove('hidden');
            } finally {
                loader.style.display = "none";
            }
        }

        // 4e. Cost Estimation
        function estimateCost(uniqueId) {
            const textArea = document.getElementById(`text-${uniqueId}`);
            const type = textArea.getAttribute('data-current-type') || 'image';
            const prompt = textArea.value;
            const status = document.getElementById(`status-${uniqueId}`);
            
            let cost = 0;
            let unit = "USD";
            let reason = "";

            // Estimates based on standard pricing (approximate)
            switch(type) {
                case 'image':
                case 'graphic':
                    // Gemini 3 Pro Image: ~$0.04 per image
                    cost = 0.04; 
                    reason = "Std. Image Gen";
                    break;
                case 'animation':
                    // Veo 2.0: ~$2.00 per video (est)
                    cost = 2.00; 
                    reason = "Video Generation";
                    break;
                case 'music':
                case 'sound_effect':
                    // Audio: ~$0.02 est
                    cost = 0.02;
                    reason = "Audio Gen";
                    break;
                case 'motion_graphics':
                     // Flash: negligible for text, but let's assume complex prompt
                     cost = 0.001;
                     reason = "Text/Code Gen";
                     break;
                default:
                    // Text (Flash): ~$0.10 / 1M tokens. 
                    // Assume 1k tokens combined in/out = $0.0001
                    cost = 0.0001; 
                    reason = "Text Gen";
                    break;
            }

            // Display
            status.innerHTML = `<span class="text-green-400 font-bold" title="${reason}">~${cost < 0.01 ? '<$0.01' : '$' + cost.toFixed(2)}</span>`;
            
            // Revert after 3s
            setTimeout(() => {
                if (status.innerText.includes('$')) {
                    status.innerText = "";
                }
            }, 3000);
        }

        // 4b. Multimodal (Image) Generation
        async function generateMultimodalContent(id, prompt, action = 'generate') {
            const parts = id.split('_'); 
            const sceneIndex = parseInt(parts[0].substring(1));
            const lineIndex = parseInt(parts[1].substring(1));
            const apiKey = document.getElementById('apiKey').value;
            if (!apiKey) {
                alert("⚠️ Please paste your Google API Key at the top first.");
                return;
            }

            const loader = document.getElementById(`loader-${id}`);
            const status = document.getElementById(`status-${id}`);
            const container = document.getElementById(`result-container-${id}`);

            loader.style.display = "block";
            status.innerText = "Creating...";
            status.className = "text-xs text-purple-400";
            container.classList.add('hidden');

            // Using gemini-3-pro-image-preview for high-quality image generation
            const modelId = "gemini-3-pro-image-preview";
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;

            const payload = {
                contents: [
                    {
                        role: "user",
                        parts: [{ text: prompt }]
                    }
                ],
                generationConfig: {
                    responseModalities: ["IMAGE", "TEXT"],
                    imageConfig: { image_size: "1K" }
                }
            };

            logDebug('REQ', 'Sending Multimodal Request', { url, payload });

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();
                logDebug('RES', `Response (${response.status})`, data);

                if (!response.ok) throw new Error(data.error?.message || `API Error: ${response.status}`);

                let htmlOutput = "";
                
                if (data.candidates?.[0]?.content?.parts) {
                    data.candidates[0].content.parts.forEach(part => {
                        if (part.inlineData) {
                            // Render Image
                            const imgSrc = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                            const filename = getArtifactFilename(id, 'Image') + '.png';
                            htmlOutput += `
                                    <img src="${imgSrc}" class="w-full h-auto rounded mb-2 border border-gray-700">
                                    <div class="flex flex-wrap gap-2 mt-2">
                                        <a href="${imgSrc}" download="${filename}" class="flex items-center gap-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 border border-blue-800 px-3 py-1.5 rounded text-xs transition">
                                            📥 Download Image
                                        </a>
                                        <button onclick="uploadArtifactFromDOM(this, '${filename}')" class="flex items-center gap-2 bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-300 border border-indigo-800 px-3 py-1.5 rounded text-xs transition">
                                            ☁️ Upload to Drive
                                        </button>
                                    </div>`;
                            
                            // Update YAML with video_name
                            updateVideoName(sceneIndex, lineIndex, filename);
                            
                            // Auto Upload to Google Drive
                            (async () => {
                                // Convert base64 to Blob
                                const byteCharacters = atob(part.inlineData.data);
                                const byteNumbers = new Array(byteCharacters.length);
                                for (let i = 0; i < byteCharacters.length; i++) {
                                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                                }
                                const byteArray = new Uint8Array(byteNumbers);
                                const blob = new Blob([byteArray], { type: 'image/png' });

                                // Upload
                                const driveLink = await autoUploadToDrive(id, blob, filename + '.png');
                                
                                if (driveLink) {
                                    updateArtifactData(sceneIndex, lineIndex, 'image', filename, driveLink);
                                    await saveChanges(true); // Save YAML to GitHub
                                    
                                     // Show Toast
                                    const toast = document.createElement('div');
                                    toast.className = 'fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-blue-900 border border-blue-700 text-blue-100 px-4 py-2 rounded shadow-xl z-[200] text-xs font-bold flex items-center gap-2 animate-bounce';
                                    toast.innerHTML = `<span>☁️ Auto-uploaded Image to Drive!</span>`;
                                    document.body.appendChild(toast);
                                    setTimeout(() => toast.remove(), 4000);
                                }
                            })();
                        } else if (part.text) {
                            // Render Text
                            htmlOutput += `<p class="mb-2 text-gray-300 border-l-2 border-purple-500 pl-2">${part.text}</p>`;
                        }
                    });
                }

                if (htmlOutput) {
                    const requestId = response.headers.get('x-goog-request-id');
                    const logUrl = requestId ? `https://aistudio.google.com/logs/${requestId}` : "https://aistudio.google.com/logs";
                    const logLink = `<div class="mt-4 pt-2 border-t border-gray-700"><a href="${logUrl}" target="_blank" class="text-xs text-gray-500 hover:text-blue-400">View Logs ↗</a></div>`;
                    container.innerHTML = htmlOutput + logLink;
                    container.classList.remove('hidden');
                    status.innerText = "✅ Done";
                    status.className = "text-xs text-green-500";
                } else {
                    throw new Error("No content generated.");
                }

            } catch (error) {
                console.error(error);
                logDebug('ERROR', error.message, error);
                status.innerText = "❌ Failed";
                status.className = "text-xs text-red-500";
                container.innerHTML = `<span class="text-red-400">Error: ${error.message}</span>`;
                container.classList.remove('hidden');
            } finally {
                loader.style.display = "none";
            }
        }

        // 4c. Audio Generation (ElevenLabs)
        async function generateAudioContent(id, prompt, action = 'generate', type = 'sound_effect') {
            const parts = id.split('_'); 
            const sceneIndex = parseInt(parts[0].substring(1));
            const lineIndex = parseInt(parts[1].substring(1));
            
            // Check for ElevenLabs Key First
            const elevenKey = document.getElementById('elevenApiKey').value;
            if (!elevenKey) {
                alert("⚠️ Please enter your ElevenLabs API Key in the top header.");
                return;
            }

            const loader = document.getElementById(`loader-${id}`);
            const status = document.getElementById(`status-${id}`);
            const container = document.getElementById(`result-container-${id}`);

            loader.style.display = "block";
            status.innerText = "Generating Audio (ElevenLabs)...";
            status.className = "text-xs text-orange-400";
            container.classList.add('hidden');

            const url = "https://api.elevenlabs.io/v1/sound-generation";
            
            // Determine duration based on explicit type
            let durationSeconds = 5.0; // Default SFX
            
            if (type === 'music') {
                durationSeconds = 11.0; // Max reasonable for music/preview
            } else if (type === 'sound_effect') {
                durationSeconds = 4.0;
            }

            const payload = {
                text: prompt,
                duration_seconds: durationSeconds,
                prompt_influence: 0.3
            };

            logDebug('REQ', 'Sending Audio Request (ElevenLabs)', { url, payload });

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 
                        'xi-api-key': elevenKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`API Error: ${response.status} - ${errText}`);
                }

                // ElevenLabs returns binary audio data directly
                const audioBlob = await response.blob();
                const audioSrc = URL.createObjectURL(audioBlob);
                
                logDebug('RES', `Response (${response.status})`, "Audio Blob Received");

                const filename = getArtifactFilename(id, 'Audio') + '.mp3';
                
                let htmlOutput = `
                    <div class="mb-4">
                        <p class="text-xs text-orange-400 mb-2">✅ Audio Generated (ElevenLabs)</p>
                        <audio controls src="${audioSrc}" class="w-full mb-2 bg-gray-800 rounded"></audio>
                        <div class="flex flex-wrap gap-2 mt-2">
                            <a href="${audioSrc}" download="${filename}" class="flex items-center gap-2 bg-orange-900/30 hover:bg-orange-900/50 text-orange-300 border border-orange-800 px-3 py-1.5 rounded text-xs transition">
                                📥 Download MP3
                            </a>
                            <button onclick="uploadArtifactFromDOM(this, '${filename}')" class="flex items-center gap-2 bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-300 border border-indigo-800 px-3 py-1.5 rounded text-xs transition">
                                ☁️ Upload to Drive
                            </button>
                        </div>
                    </div>`;

                // Update YAML
                updateVideoName(sceneIndex, lineIndex, filename);

                // Auto Upload
                (async () => {
                   const driveLink = await autoUploadToDrive(id, audioBlob, filename);
                   if (driveLink) {
                       updateArtifactData(sceneIndex, lineIndex, 'music', filename, driveLink);
                       await saveChanges(true); 
                       const toast = document.createElement('div');
                       toast.className = 'fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-purple-900 border border-purple-700 text-purple-100 px-4 py-2 rounded shadow-xl z-[200] text-xs font-bold flex items-center gap-2 animate-bounce';
                       toast.innerHTML = `<span>☁️ Auto-uploaded Audio to Drive!</span>`;
                       document.body.appendChild(toast);
                       setTimeout(() => toast.remove(), 4000);
                   }
                })();

                container.innerHTML = htmlOutput;
                container.classList.remove('hidden');
                status.innerText = "✅ Done";
                status.className = "text-xs text-green-500";

            } catch (error) {
                console.error(error);
                logDebug('ERROR', error.message, error);
                status.innerText = "❌ Failed";
                status.className = "text-xs text-red-500";
                container.innerHTML = `<span class="text-red-400">Error: ${error.message}</span>`;
                container.classList.remove('hidden');
            } finally {
                loader.style.display = "none";
            }
        }

        // 4d. Video Generation (Veo 2.0)
        async function generateVideoContent(id, prompt, action = 'generate') {
            const parts = id.split('_'); 
            const sceneIndex = parseInt(parts[0].substring(1));
            const lineIndex = parseInt(parts[1].substring(1));
            const apiKey = document.getElementById('apiKey').value;
            if (!apiKey) {
                alert("⚠️ Please paste your Google API Key at the top first.");
                return;
            }

            const loader = document.getElementById(`loader-${id}`);
            const status = document.getElementById(`status-${id}`);
            const container = document.getElementById(`result-container-${id}`);

            loader.style.display = "block";
            status.innerText = "Generating Video... (This may take a minute)";
            status.className = "text-xs text-blue-400";
            container.classList.add('hidden');

            const modelId = "veo-2.0-generate-001";
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:predictLongRunning`;

            const payload = {
                instances: [{ prompt: prompt }],
                parameters: {
                    aspectRatio: "16:9",
                    sampleCount: 1,
                    durationSeconds: 8,
                    personGeneration: "ALLOW_ALL"
                }
            };

            logDebug('REQ', 'Sending Video Request', { url, payload });

            try {
                // 1. Start Operation
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();
                logDebug('RES', `Initial Response (${response.status})`, data);

                if (!response.ok) throw new Error(data.error?.message || `API Error: ${response.status}`);

                let opName = data.name; // Format: projects/.../locations/.../operations/...
                if (!opName) throw new Error("No operation name returned.");

                // 2. Poll Operation
                status.innerText = "Rendering Video...";
                let videoUri = null;
                
                while (true) {
                    await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
                    
                    const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${opName}`;
                    const pollResponse = await fetch(pollUrl, {
                         headers: { 'X-goog-api-key': apiKey }
                    });
                    const pollData = await pollResponse.json();
                    
                    logDebug('POLL', 'Checking Status', pollData);

                    if (pollData.done) {
                        if (pollData.error) {
                            throw new Error(pollData.error.message || "Video generation failed during processing.");
                        }
                        
                        // Extract Video URI
                        // Structure: response.generateVideoResponse.generatedSamples[0].video.uri
                        const samples = pollData.response?.generateVideoResponse?.generatedSamples;
                        if (samples && samples.length > 0 && samples[0].video?.uri) {
                            videoUri = samples[0].video.uri;
                        } else {
                            throw new Error("Operation done but no video URI found.");
                        }
                        break; 
                    }
                }

                // 3. Display Result
                if (videoUri) {
                    // The video URI is a GCS-like link containing the key if passed correctly, but let's append key just in case
                    const fetchVideoUrl = `${videoUri}&key=${apiKey}`;
                    const filename = getArtifactFilename(id, 'Video') + '.mp4';
                    
                    const videoHtml = `
                        <div class="mb-4">
                            <p class="text-xs text-green-400 mb-2">✅ Video Generated Successfully</p>
                            <video controls width="100%" class="rounded border border-gray-700 mb-2">
                                <source src="${fetchVideoUrl}" type="video/mp4">
                                Your browser does not support the video tag.
                            </video>
                            <div class="flex flex-wrap gap-2 mt-2">
                                <a href="${fetchVideoUrl}" download="${filename}" class="flex items-center gap-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 border border-blue-800 px-3 py-1.5 rounded text-xs transition">
                                    📥 Download MP4
                                </a>
                                <button onclick="uploadArtifactFromDOM(this, '${filename}')" class="flex items-center gap-2 bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-300 border border-indigo-800 px-3 py-1.5 rounded text-xs transition">
                                    ☁️ Upload to Drive
                                </button>
                            </div>
                        </div>
                    `;
                    
                    // Update YAML with video_name
                    updateVideoName(sceneIndex, lineIndex, filename);
                    
                    container.innerHTML = videoHtml;
                    container.classList.remove('hidden');
                    status.innerText = "✅ Done";
                    status.className = "text-xs text-green-500";

                    // Auto Download removed
                    // if (action === 'upload') {
                    //    uploadArtifact(fetchVideoUrl, filename);
                    //} else {
                    //    triggerAutoDownload(fetchVideoUrl, filename);
                    //}

                }

            } catch (error) {
                console.error(error);
                logDebug('ERROR', error.message, error);
                status.innerText = "❌ Failed";
                status.className = "text-xs text-red-500";
                container.innerHTML = `<span class="text-red-400">Error: ${error.message}</span>`;
                container.classList.remove('hidden');
            } finally {
                loader.style.display = "none";
            }
        }



        // 4e. Enhance Prompt
        async function enhancePrompt() {
             const apiKey = document.getElementById('apiKey').value;
            if (!apiKey) {
                alert("⚠️ Please paste your Google API Key at the top first.");
                return;
            }

            const promptBox = document.getElementById('preview-final-prompt');
            const originalPrompt = promptBox.value;
            if (!originalPrompt) return;

            const btn = document.getElementById('enhance-btn');
            const originalBtnText = btn.innerHTML;
            
            btn.innerHTML = "✨ Enhancing...";
            btn.disabled = true;

            const modelId = "gemini-2.0-flash";
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;
            
            const type = pendingGeneration ? pendingGeneration.type : "general";
            let typeInstruction = "";
            
            if (['image', 'graphic', 'texture'].includes(type)) {
                typeInstruction = "Focus on visual details, lighting, composition, artistic style, and mood. describe the scene vividly.";
            } else if (['animation', 'video', 'transition'].includes(type)) {
                typeInstruction = "Focus on movement, camera angles, pacing, physics, and temporal progression. Describe the action and flow.";
            } else if (['music', 'sound_effect', 'voice_over'].includes(type)) {
                typeInstruction = "Focus on audio characteristics, instrumentation, tempo, mood, texture, and sound quality. Describe the auditory experience.";
            }

            const systemInstruction = `Enhance the following prompt to be more descriptive, detailed, and optimized for creating a ${type.toUpperCase()}. ${typeInstruction} Maintain the original intent, style matches, and specific details. output ONLY the enhanced prompt content.`;

            const payload = {
                contents: [{
                    role: "user",
                    parts: [{ text: `SYSTEM: ${systemInstruction}\n\nPROMPT TO ENHANCE: ${originalPrompt}` }]
                }]
            };

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();
                
                if (!response.ok) throw new Error(data.error?.message || `API Error: ${response.status}`);

                if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    const enhancedText = data.candidates[0].content.parts[0].text.trim();
                    promptBox.value = enhancedText;
                    
                    // Flash effect to show update
                    promptBox.classList.add('bg-purple-900/30');
                    setTimeout(() => promptBox.classList.remove('bg-purple-900/30'), 500);
                } else {
                    throw new Error("No content generated");
                }

            } catch (error) {
                console.error("Enhance failed:", error);
                alert(`Enhance failed: ${error.message}`);
            } finally {
                btn.innerHTML = originalBtnText;
                btn.disabled = false;
            }
        }

        function copyFinalPrompt(btn) {
            const textarea = document.getElementById('preview-final-prompt');
            textarea.select();
            document.execCommand('copy'); 
            
            const originalText = btn.innerHTML;
            btn.innerHTML = "✅ Copied";
            setTimeout(() => btn.innerHTML = originalText, 2000);
        }

        function clearTransitionPreview() {
            if(confirm("Clear the transition context?")) {
                // 1. Clear text box
                const transInput = document.getElementById('preview-transition-context');
                transInput.value = "";
                
                // 2. Remove from Final Prompt
                const finalInput = document.getElementById('preview-final-prompt');
                // Regex to match [TRANSITION TO NEXT SCENE: ...] including newlines
                const regex = /\[TRANSITION TO NEXT SCENE: [\s\S]*?\]\n?/g;
                finalInput.value = finalInput.value.replace(regex, "");
            }
        }

        // 5. HELPER FUNCTIONS
        // ==========================================

        function constructFullPrompt(sceneIndex, promptText, type) {
            // 2. Gather Contexts
            const mainCtx = window.mainContext || "";
            const sceneCtx = scenes[sceneIndex].context || "";
            const transitionCtx = scenes[sceneIndex].transition || "";

            // 3. Construct Context Block
            let contextBlock = "";
            let finalPrompt = "";
            
            if (mainCtx) contextBlock += `[PROJECT CONTEXT: ${mainCtx}]\n`;
            if (sceneCtx) contextBlock += `[SCENE CONTEXT: ${sceneCtx}]\n`;
            if (transitionCtx) contextBlock += `[TRANSITION TO NEXT SCENE: ${transitionCtx}]\n`;

            if (contextBlock) {
                finalPrompt = `${contextBlock.trim()}\n\n[PROMPT]: ${promptText}`;
            } else {
                finalPrompt = promptText;
            }

            // Prepend Creation Type
            let typeLabel = (type || "").toUpperCase();
            if (type === 'animation') typeLabel = 'VIDEO'; 
            
            finalPrompt = `[CREATE ${typeLabel}] > ${finalPrompt}`;

            if (type === 'motion_graphics') {
                 finalPrompt += " (Note: This prompt is generated for Canva)";
            }

            return finalPrompt;
        }
        

        // ==========================================
        // 5.5 GOOGLE DRIVE UPLOAD LOGIC
        // ==========================================

        let tokenClient;
        let accessToken = null;

        function getDriveConfig() {
            const config = localStorage.getItem('drive_config');
            return config ? JSON.parse(config) : null;
        }

        function openDriveModal() {
            const config = getDriveConfig();
            if (config) {
                document.getElementById('drive-client-id').value = config.clientId || '';
                document.getElementById('drive-folder-id').value = config.folderId || '1E_ctpNSyieC_fr2xowbg_RfXZDVWbgzJ';
            }
            document.getElementById('drive-modal').classList.remove('hidden');
        }

        function closeDriveModal() {
            document.getElementById('drive-modal').classList.add('hidden');
        }

        function saveDriveConfig() {
            const clientId = document.getElementById('drive-client-id').value.trim();
            const folderId = document.getElementById('drive-folder-id').value.trim();

            if (!clientId || !folderId) {
                alert("Please enter both Client ID and Folder ID.");
                return;
            }

            localStorage.setItem('drive_config', JSON.stringify({ clientId, folderId }));
            closeDriveModal();
            
            // Re-initialize token client if needed
            accessToken = null; // Clear old token
            initTokenClient(clientId);
            
            alert("Drive Configuration Saved!");
        }

        function initTokenClient(clientId) {
            if (!window.google) {
                console.error("Google Identity Services script not loaded.");
                return;
            }
            
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'https://www.googleapis.com/auth/drive.file',
                callback: (tokenResponse) => {
                    accessToken = tokenResponse.access_token;
                    // Resume pending upload if any - but for simplicity, we just ask user to click again or we could auto-retry
                    // For now, simpler flow: User clicks "Upload", auth happens, then they might need to click again or we chain it.
                    // Better UX: Return a promise resolver from the auth request.
                    if (window.pendingUploadResolver) {
                         window.pendingUploadResolver(accessToken);
                         window.pendingUploadResolver = null;
                    }
                },
            });
        }

        // Initialize on load if config exists
        window.addEventListener('load', () => {
            const config = getDriveConfig();
            if (config && config.clientId) {
                // Wait for script to load
                const checkGoogle = setInterval(() => {
                    if (window.google) {
                        clearInterval(checkGoogle);
                        initTokenClient(config.clientId);
                    }
                }, 100);
            }
        });

        async function getAccessToken() {
            const config = getDriveConfig();
            if (!config || !config.clientId) {
                openDriveModal();
                throw new Error("Missing Drive Configuration");
            }

            if (accessToken) return accessToken;

            // Trigger Auth
            return new Promise((resolve) => {
                window.pendingUploadResolver = resolve;
                if (!tokenClient) initTokenClient(config.clientId);
                // Skips consent if already signed in and authorized
                tokenClient.requestAccessToken({ prompt: '' }); 
            });
        }
        
        // Helper to find or create a folder
        async function findOrCreateFolder(name, parentId, accessToken) {
            const query = `mimeType='application/vnd.google-apps.folder' and name='${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed=false`;
            const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;
            
            const res = await fetch(url, {
                headers: { 'Authorization': 'Bearer ' + accessToken }
            });
            const data = await res.json();
            
            if (data.files && data.files.length > 0) {
                return data.files[0].id;
            } else {
                // Create it
                const metadata = {
                    name: name,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [parentId]
                };
                
                 const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
                    method: 'POST',
                    headers: { 
                        'Authorization': 'Bearer ' + accessToken,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(metadata)
                });
                const createData = await createRes.json();
                return createData.id;
            }
        }

        function uploadArtifactFromDOM(btn, filename) {
             const container = btn.parentElement;
             // Find uniqueId context (parent with id result-container-...)
             const resultContainer = btn.closest('[id^="result-container-"]');
             let uniqueId = null;
             if (resultContainer) {
                 uniqueId = resultContainer.id.replace('result-container-', '');
             }
             
             // Try to find source from various elements
             let src = null;
             const link = container.querySelector('a[download]');
             const img = container.parentElement.querySelector('img');
             const video = container.parentElement.querySelector('video source');
             const audio = container.parentElement.querySelector('audio source');

             if (link) src = link.href;
             else if (img) src = img.src;
             else if (video) src = video.src;
             else if (audio) src = audio.src;

             if (src) {
                 handleDriveUpload(src, filename, btn, uniqueId);
             } else {
                 console.error("Could not find artifact source");
                 alert("Error: Could not find artifact source.");
             }
        }

        async function handleDriveUpload(src, filename, btn, uniqueId) {
            const originalText = btn.innerText;
            btn.innerText = "⏳ Uploading...";
            btn.disabled = true;

            try {
                const token = await getAccessToken();
                const config = getDriveConfig();
                let uploadFolderId = config.folderId; // Default to root
                let type = "Artifact"; // Lifted scope
                
                // Dynamic Folder Structure
                if (uniqueId) {
                    btn.innerText = "📂 Organizing...";
                    
                    // Parse ID
                    const parts = uniqueId.match(/s(\d+)_l(\d+)/);
                    if (parts) {
                        const sceneIndex = parseInt(parts[1]);
                        const lineIndex = parseInt(parts[2]);
                        
                        // 1. Project Folder
                        const projectTitle = (window.projectTitle || "Project").replace(/[^a-zA-Z0-9 ]/g, '_');
                        const projFolderId = await findOrCreateFolder(projectTitle, config.folderId, token);
                        
                        // 2. Scene Folder
                        const scene = scenes[sceneIndex];
                        const safeSceneTitle = scene.title.replace(/[^a-zA-Z0-9 ]/g, '_');
                        const sceneFolderName = `Scene ${scene.id} ${safeSceneTitle}`;
                        const sceneFolderId = await findOrCreateFolder(sceneFolderName, projFolderId, token);
                        
                        uploadFolderId = sceneFolderId;
                        
                        // Simplify Filename for inside the folder
                        // Current filename: Project_Scene_Line1_Type_Date
                        // Desired: Line1_Type_Date
                        const lineId = scene.lines[lineIndex].id;
                        // Determine type from filename matching
                        if(filename.includes("Image")) type = "Image";
                        else if(filename.includes("Video")) type = "Video";
                        else if(filename.includes("Audio")) type = "Audio";
                        
                        const now = new Date();
                        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
                        
                        filename = `Line${lineId}_${type}_${dateStr}`;
                        if (src.startsWith('data:image')) filename += '.png';
                        else if (src.startsWith('data:audio')) filename += '.mp3';
                        else if (filename.includes('mp4') || src.includes('mp4')) filename = filename.replace('.mp4','') + '.mp4'; // Ensure ext
                    }
                }
                
                btn.innerText = "⬆️ Sending...";
                
                // Fetch blob data
                const response = await fetch(src);
                const blob = await response.blob();
                
                const uploadData = await performDriveUpload(blob, filename, uploadFolderId, token);
                
                // Capture Link and Update YAML
                if (uploadData && uploadData.webViewLink && uniqueId) {
                     const parts = uniqueId.match(/s(\d+)_l(\d+)/);
                     if (parts) {
                        const sceneIndex = parseInt(parts[1]);
                        const lineIndex = parseInt(parts[2]);
                        updateArtifactData(sceneIndex, lineIndex, type.toLowerCase(), filename, uploadData.webViewLink);
                        
                        // Auto-save to GitHub to persist the Drive link
                        await saveChanges(true);

                        // Show localized toast for double save
                        const toast = document.createElement('div');
                        toast.className = 'fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-green-900 border border-green-700 text-green-100 px-4 py-2 rounded shadow-xl z-[200] text-xs font-bold flex items-center gap-2 animate-bounce';
                        toast.innerHTML = `<span>☁️ Drive Link Saved to GitHub!</span>`;
                        document.body.appendChild(toast);
                        setTimeout(() => toast.remove(), 4000);
                     }
                }

                btn.innerText = "✅ Uploaded!";
                btn.classList.remove('text-indigo-400');
                btn.classList.add('text-green-400');
                
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.disabled = false;
                    btn.classList.add('text-indigo-400');
                    btn.classList.remove('text-green-400');
                }, 3000);

            } catch (err) {
                console.error("Drive Upload Error:", err);
                if (err.message !== "Missing Drive Configuration") {
                     alert("Upload Failed: " + err.message);
                }
                btn.innerText = "❌ Failed";
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.disabled = false;
                }, 3000);
            }
        }

        async function performDriveUpload(blob, filename, folderId, accessToken) {
            const metadata = {
                name: filename,
                parents: [folderId]
            };

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', blob);

            const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink';
            
            const response = await fetch(url, {
                method: 'POST',
                headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
                body: form
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error?.message || "Upload failed");
            }
            
            console.log("File uploaded:", data);
            return data;
        }

        // Old manual function kept for fallback/reference if needed, but not used by button anymore
        async function uploadArtifact(src, filename) {
             // ... existing manual logic ...
             try {
                triggerAutoDownload(src, filename);
                window.open('https://drive.google.com/drive/folders/1E_ctpNSyieC_fr2xowbg_RfXZDVWbgzJ', '_blank');
                alert(`File '${filename}' has been downloaded.\n\nPlease upload it to the Google Drive folder that just opened.`);
             } catch (err) {
                console.error("Upload workflow failed", err);
                alert("Failed to process upload workflow: " + err.message);
             }
        }

        function getArtifactFilename(uniqueId, type) {
            // uniqueId format: "s{sceneIndex}_l{lineIndex}"
            const parts = uniqueId.match(/s(\d+)_l(\d+)/);
            if (!parts) return `artifact_${Date.now()}`;

            const sceneIndex = parseInt(parts[1]);
            const lineIndex = parseInt(parts[2]);
            
            const sceneTitle = scenes[sceneIndex].title.replace(/[^a-zA-Z0-9]/g, '_');
            const lineId = scenes[sceneIndex].lines[lineIndex].id;
            
            // Clean Project Title
            const projTitle = (window.projectTitle || "Project").replace(/[^a-zA-Z0-9]/g, '_');
            
            const now = new Date();
            const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
            
            return `${projTitle}_${sceneTitle}_Line${lineId}_${type}_${dateStr}`;
        }

        function updateVideoName(sceneIndex, lineIndex, filename) {
             // In-memory update
             scenes[sceneIndex].lines[lineIndex].video_name = filename;
             console.log(`Updated video_name for S${sceneIndex} L${lineIndex} to ${filename}`);
             
             // Add a small visual indicator or toast could be nice here
        }

        function updateArtifactData(sceneIndex, lineIndex, type, filename, url) {
            // Ensure uploaded_assets object exists
            if (!scenes[sceneIndex].lines[lineIndex].uploaded_assets) {
                scenes[sceneIndex].lines[lineIndex].uploaded_assets = {};
            }
            
            scenes[sceneIndex].lines[lineIndex].uploaded_assets[type] = {
                filename: filename,
                url: url,
                last_uploaded: new Date().toISOString()
            };
            
            console.log(`Updated uploaded_assets for S${sceneIndex} L${lineIndex} [${type}]`, scenes[sceneIndex].lines[lineIndex].uploaded_assets[type]);
            
            // Show a temporary toast for feedback
            const toast = document.createElement('div');
            toast.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-green-900 border border-green-700 text-green-100 px-4 py-2 rounded shadow-xl z-[200] text-xs font-bold flex items-center gap-2 animate-bounce';
            toast.innerHTML = `<span>🔗 Link Saved to YAML!</span>`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }

        function triggerAutoDownload(url, filename) {
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }

        // ==========================================
        // 6. EXPORT & DOWNLOAD
        // ==========================================
        function downloadYAML() {
            if (scenes.length === 0) {
                alert("No data loaded to download.");
                return;
            }
            
            try {
                // Increment Version & Update Date
                projectVersion = (parseInt(projectVersion) || 0) + 1;
                lastUpdated = new Date().toISOString();

                // Wrap in root object to match original structure
                const exportData = { 
                    title: window.projectTitle || "",
                    main_context: window.mainContext || "",
                    verified_main_context: window.verifiedMainContext || false,
                    version: projectVersion,
                    last_updated: lastUpdated,
                    scenes: scenes 
                };
                // Dump to YAML
                const yamlStr = jsyaml.dump(exportData, { lineWidth: -1 });
                
                const blob = new Blob([yamlStr], { type: 'text/yaml' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.setAttribute('hidden', '');
                a.setAttribute('href', url);
                a.setAttribute('download', 'scenes.yaml');
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } catch (e) {
                console.error("YAML Export failed:", e);
                alert("Failed to export YAML: " + e.message);
            }
        }

        function downloadCSV() {
            if (scenes.length === 0) {
                alert("No data loaded to download.");
                return;
            }
            // Add columns for all new prompt types
            let csv = "Scene,Line,Timecode,Detailed Script,Prompt Image,Prompt Graphic,Prompt Music,Prompt Animation,Prompt Motion Graphics,Prompt Sound Effect,Video Name\n";
            
            scenes.forEach(scene => {
                scene.lines.forEach(line => {
                    const p = line.prompts || {};
                    const v = line.verified_prompts || {};
                    // Escape quotes for CSV for all fields
                    const safe = (text) => text ? `"${text.replace(/"/g, '""')}"` : '""';
                    // Helper for verification status
                    const isV = (type) => v[type] ? " (Verified)" : "";
                    
                    csv += `"${scene.id}", "${line.id}", "${line.time}", ${safe(line.script)}, ${safe(p.image + isV('image'))}, ${safe(p.graphic + isV('graphic'))}, ${safe(p.music + isV('music'))}, ${safe(p.animation + isV('animation'))}, ${safe(p.motion_graphics + isV('motion_graphics'))}, ${safe(p.sound_effect + isV('sound_effect'))}, ${safe(line.video_name)}\n`;
                });
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', 'nanabanana_prompts.csv');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }

        // ==========================================
        // 7. GITHUB API INTEGRATION
        // ==========================================

        function checkGithubConfig() {
            const config = localStorage.getItem('github_config');
            return config ? JSON.parse(config) : null;
        }

        function openGithubModal() {
            const config = checkGithubConfig();
            if (config) {
                document.getElementById('gh-owner').value = config.owner || 'rifaterdemsahin';
                document.getElementById('gh-repo').value = config.repo || 'post-production-planning';
                document.getElementById('gh-path').value = config.path || '6_Symbols/scenes.yaml';
                document.getElementById('gh-branch').value = config.branch || 'main';
                document.getElementById('gh-token').value = config.token || '';
            } else {
                // Defaults
                document.getElementById('gh-owner').value = 'rifaterdemsahin';
                document.getElementById('gh-repo').value = 'post-production-planning';
                document.getElementById('gh-path').value = '6_Symbols/scenes.yaml';
                document.getElementById('gh-branch').value = 'main';
            }
            document.getElementById('github-modal').classList.remove('hidden');
        }

        function closeGithubModal() {
            document.getElementById('github-modal').classList.add('hidden');
        }

        function saveGithubConfig() {
            const owner = document.getElementById('gh-owner').value.trim();
            const repo = document.getElementById('gh-repo').value.trim();
            const path = document.getElementById('gh-path').value.trim();
            const branch = document.getElementById('gh-branch').value.trim() || 'main';
            const token = document.getElementById('gh-token').value.trim();

            if (!owner || !repo || !path || !token) {
                alert("Please fill in all GitHub configuration fields.");
                return;
            }

            const config = { owner, repo, path, branch, token };
            localStorage.setItem('github_config', JSON.stringify(config));
            closeGithubModal();
            
            alert("Configuration saved! You can now use the 'Save YAML' button.");
        }

        // ==========================================
        // 7.5 GENERIC PROGRESS MODAL
        // ==========================================
        
        function showProgressModal(title, message, icon="⏳") {
            document.getElementById('gpm-title').innerText = title;
            document.getElementById('gpm-message').innerText = message;
            document.getElementById('gpm-icon').innerText = icon;
            document.getElementById('gpm-icon').classList.add('animate-pulse');
            document.getElementById('gpm-details').classList.add('hidden');
            document.getElementById('gpm-close-btn').classList.add('hidden');
            document.getElementById('generic-progress-modal').classList.remove('hidden');
        }

        function updateProgressModal(title, message, icon) {
            if(title) document.getElementById('gpm-title').innerText = title;
            if(message) document.getElementById('gpm-message').innerText = message;
            if(icon) document.getElementById('gpm-icon').innerText = icon;
        }

        function showProgressError(message, details, actionLabel, actionCallback) {
            document.getElementById('gpm-title').innerText = "Error";
            document.getElementById('gpm-icon').innerText = "❌";
            document.getElementById('gpm-icon').classList.remove('animate-pulse');
            document.getElementById('gpm-message').innerText = message;
            
            const detEl = document.getElementById('gpm-details');
            if (details) {
                detEl.innerText = details;
                detEl.classList.remove('hidden');
            }

            const actionBtn = document.getElementById('gpm-action-btn');
            if (actionLabel && actionCallback) {
                actionBtn.innerText = actionLabel;
                actionBtn.onclick = () => {
                    closeGenericProgressModal();
                    actionCallback();
                };
                actionBtn.classList.remove('hidden');
            } else {
                actionBtn.classList.add('hidden');
            }

            document.getElementById('gpm-close-btn').classList.remove('hidden');
        }

        function showProgressSuccess(message) {
             document.getElementById('gpm-title').innerText = "Success";
             document.getElementById('gpm-icon').innerText = "✅";
             document.getElementById('gpm-icon').classList.remove('animate-pulse');
             document.getElementById('gpm-message').innerText = message;
             document.getElementById('gpm-close-btn').classList.remove('hidden');
             
             // Auto close after 2 seconds for smooth UX
             setTimeout(() => {
                 closeGenericProgressModal();
             }, 2000);
        }

        function closeGenericProgressModal() {
            document.getElementById('generic-progress-modal').classList.add('hidden');
        }

        async function saveChanges(skipConfirm = false) {
            const config = checkGithubConfig();
            if (!config) {
                openGithubModal();
                return;
            }

            if (!skipConfirm) {
                const confirmSave = confirm(`Save changes to ${config.owner}/${config.repo}/${config.path}?`);
                if (!confirmSave) return;
            }

            // Show Modal
            showProgressModal("Saving to GitHub", "Connecting to repository...");

            const btn = document.querySelector('button[onclick="saveChanges()"]');
            const originalText = btn ? btn.innerText : "💾 Save YAML";
            if (btn) {
                btn.innerText = "⏳ Saving...";
                btn.disabled = true;
            }

            try {
                // 1. Prepare YAML Content
                updateProgressModal(null, "Generating YAML...");
                
                // Increment Version & Update Date
                projectVersion = (parseInt(projectVersion) || 0) + 1;
                lastUpdated = new Date().toISOString();

                const exportData = { 
                    title: window.projectTitle || "",
                    main_context: window.mainContext || "",
                    verified_main_context: window.verifiedMainContext || false,
                    version: projectVersion,
                    last_updated: lastUpdated,
                    scenes: scenes 
                };
                const yamlStr = jsyaml.dump(exportData, { lineWidth: -1 });
                // Robust Base64 encoding for UTF-8 content
                const contentBase64 = btoa(unescape(encodeURIComponent(yamlStr))); 

                // 2. Get current file SHA (needed for update)
                updateProgressModal(null, "Fetching file info...");
                const apiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.path}?ref=${config.branch}`;
                
                logDebug('REQ', 'Getting File SHA', { url: apiUrl });
                
                const getRes = await fetch(apiUrl, {
                    headers: {
                        'Authorization': `token ${config.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                if (!getRes.ok && getRes.status !== 404) {
                    throw new Error(`Failed to fetch file info: ${getRes.status} ${getRes.statusText}`);
                }

                let sha = null;
                if (getRes.ok) {
                    const getData = await getRes.json();
                    sha = getData.sha;
                }

                // 3. Update File
                updateProgressModal(null, "Uploading new content...");
                const putBody = {
                    message: `Update scenes.yaml via Gemini Scene Creator - ${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
                    content: contentBase64,
                    branch: config.branch
                };
                if (sha) putBody.sha = sha;

                logDebug('REQ', 'Updating File', { url: apiUrl, sha: sha });

                const putRes = await fetch(apiUrl, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${config.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(putBody)
                });

                if (!putRes.ok) {
                    const errData = await putRes.json();
                    throw new Error(errData.message || `Save failed: ${putRes.status}`);
                }

                const putData = await putRes.json();
                logDebug('RES', 'File Saved', putData);
                
                showProgressSuccess("Successfully saved to GitHub!");
                
            } catch (error) {
                console.error('GitHub Save Error:', error);
                logDebug('ERROR', 'GitHub Save Failed', error.message);
                
                if (error.message.includes('401')) {
                     showProgressError("Authentication Failed", "Your GitHub token is invalid or expired (401).", "Update Settings", openGithubModal);
                } else {
                     showProgressError("Failed to save", error.message);
                }
            } finally {
                if (btn) {
                    btn.innerText = originalText;
                    btn.disabled = false;
                }
            }
        }


async function uploadAssetToGitHub(filename, contentBase64) {
    const config = checkGithubConfig();
    if (!config) {
        console.warn("Skipping GitHub upload: No configuration found.");
        return null;
    }

    const apiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/assets/${filename}`;
    
    try {
        // 1. Check if file exists to get SHA
        let sha = null;
        const getRes = await fetch(apiUrl, {
            headers: {
                'Authorization': `token ${config.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (getRes.ok) {
            const getData = await getRes.json();
            sha = getData.sha;
        }

        // 2. Upload/Update File
        const putBody = {
            message: `Upload asset ${filename} via Gemini Scene Creator`,
            content: contentBase64,
            branch: config.branch
        };
        if (sha) putBody.sha = sha;

        logDebug('REQ', 'Uploading Asset to GitHub', { url: apiUrl, filename });

        const putRes = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${config.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(putBody)
        });

        if (!putRes.ok) {
            const errData = await putRes.json();
            throw new Error(errData.message || `Upload failed: ${putRes.status}`);
        }

        const putData = await putRes.json();
        logDebug('RES', 'Asset Uploaded', putData);

        return putData.content.download_url; // Return raw link

    } catch (error) {
        console.error("GitHub Asset Upload Error:", error);
        logDebug('ERROR', 'Asset Upload Failed', error.message);
        return null; 
    }
}

async function autoUploadToDrive(uniqueId, blob, filename) {
    try {
        const token = await getAccessToken();
        if (!token) {
            console.warn("Skipping Drive upload: No token.");
            return null;
        }

        const config = getDriveConfig();
        let uploadFolderId = config.folderId; 
        let type = "Artifact";

        // Parse ID for Folder Logic (Project -> Scene)
        const parts = uniqueId.match(/s(\d+)_l(\d+)/);
        if (parts) {
            const sceneIndex = parseInt(parts[1]);
            const lineIndex = parseInt(parts[2]);
            
            // 1. Project Folder
            const projectTitle = (window.projectTitle || "Project").replace(/[^a-zA-Z0-9 ]/g, '_');
            const projFolderId = await findOrCreateFolder(projectTitle, config.folderId, token);
            
            // 2. Scene Folder
            const scene = scenes[sceneIndex];
            const safeSceneTitle = scene.title.replace(/[^a-zA-Z0-9 ]/g, '_');
            const sceneFolderName = `Scene ${scene.id} ${safeSceneTitle}`;
            const sceneFolderId = await findOrCreateFolder(sceneFolderName, projFolderId, token);
            
            uploadFolderId = sceneFolderId;
        }

        // Upload
        const uploadData = await performDriveUpload(blob, filename, uploadFolderId, token);
        return uploadData.webViewLink; // Return Drive Link

    } catch (error) {
        console.error("Auto Drive Upload Error:", error);
        return null;
    }
}

        // ==========================================
        // 8. BULK GENERATION LOGIC
        // ==========================================
        
        const bulkLogContainer = document.getElementById('bulk-log-container');
        let isBulkGenerating = false;

        function openBulkGenModal() {
            // Check for verified items
            let count = 0;
            const previewList = document.getElementById('bulk-preview-list');
            previewList.innerHTML = '';
            
            scenes.forEach((scene, sIdx) => {
                scene.lines.forEach((line, lIdx) => {
                    const v = line.verified_prompts || {};
                    Object.keys(v).forEach(type => {
                         if(v[type]) {
                             count++;
                             // Add to preview list
                             
                             // Get scene index and prompt text for preview construction
                             const promptText = line.prompts ? line.prompts[type] : "";
                             const fullPrompt = constructFullPrompt(sIdx, promptText, type);

                             const li = document.createElement('li');
                             li.innerHTML = `
                                <div class="flex justify-between items-center bg-gray-900/50 p-1 rounded hover:bg-gray-700 transition" title="${fullPrompt.replace(/"/g, '&quot;')}">
                                    <span class="text-gray-300 cursor-help border-b border-dotted border-gray-600">${scene.id} Line ${line.id}</span>
                                    <span class="text-[10px] text-blue-300 border border-blue-900 px-1 rounded">${type}</span>
                                </div>
                             `;
                             previewList.appendChild(li);
                         }
                    });
                });
            });

            const previewContainer = document.getElementById('bulk-preview-container');
            if (count > 0) {
                previewContainer.classList.remove('hidden');
            } else {
                previewContainer.classList.add('hidden');
            }

            document.getElementById('bulk-progress-modal').classList.remove('hidden');
            document.getElementById('bulk-status-text').innerText = `Found ${count} verified items ready to process.`;
            document.getElementById('bulk-percentage').innerText = "0%";
            document.getElementById('bulk-progress-bar').style.width = "0%";
            bulkLogContainer.innerHTML = `<div class="text-gray-500 italic">Logs will appear here...</div>`;
            document.getElementById('bulk-start-btn').disabled = count === 0;
            if (count === 0) {
                 bulkLogHtml("⚠️ No verified prompts found. Mark prompts as 'Verified' first.", "text-yellow-500");
            }
        }

        function closeBulkGenModal() {
            if (isBulkGenerating) {
                if(!confirm("Generation is in progress. Are you sure you want to close?")) return;
            }
            document.getElementById('bulk-progress-modal').classList.add('hidden');
        }

        async function startBulkGeneration() {
            if (isBulkGenerating) return;
            isBulkGenerating = true;
            const btn = document.getElementById('bulk-start-btn');
            btn.disabled = true;
            btn.innerText = "⏳ Processing...";
            
            bulkLogContainer.innerHTML = ""; // Clear logs
            
            // Collect Tasks
            const tasks = [];
            scenes.forEach((scene, sIdx) => {
                scene.lines.forEach((line, lIdx) => {
                    const v = line.verified_prompts || {};
                    Object.keys(v).forEach(type => {
                        if (v[type]) {
                            tasks.push({
                                uniqueId: `s${sIdx}_l${lIdx}`,
                                type: type,
                                sceneId: scene.id,
                                lineId: line.id,
                                prompt: line.prompts ? line.prompts[type] : ""
                            });
                        }
                    });
                });
            });

            const total = tasks.length;
            if (total === 0) {
                isBulkGenerating = false;
                btn.disabled = false;
                btn.innerText = "🚀 Start Generation";
                return;
            }

            for (let i = 0; i < total; i++) {
                const task = tasks[i];
                const progress = Math.round(((i) / total) * 100);
                updateBulkProgress(progress, `Processing ${i+1}/${total}: ${task.sceneId} Line ${task.lineId} (${task.type})`);
                
                bulkLogHtml(`[${i+1}/${total}] Starting: ${task.sceneId} Line ${task.lineId} - ${task.type}...`, "text-blue-400");
                
                try {
                    // Context Construction (Reuse existing logic or call handleGenerate logic)
                     // 1. Get IDs
                    const parts = task.uniqueId.split('_'); 
                    const sceneIndex = parseInt(parts[0].substring(1));
                    
                    // 3. Construct Context Block using Helper
                    const finalPrompt = constructFullPrompt(sceneIndex, task.prompt, task.type);

                    // Call specific generation function
                    // Note: These functions update the main UI. 
                    // We might want to scroll to them or just let them update silently in background.
                    if (task.type === 'image' || task.type === 'graphic') {
                        await generateMultimodalContent(task.uniqueId, finalPrompt);
                    } else if (task.type === 'animation') {
                        // Video generation is long-running. 
                        // For bulk, strictly sequential video gen might be too slow, but let's stick to it for safety.
                        await generateVideoContent(task.uniqueId, finalPrompt);
                    } else if (task.type === 'music' || task.type === 'sound_effect') {
                        await generateAudioContent(task.uniqueId, finalPrompt);
                    } else {
                        await generateContent(task.uniqueId, finalPrompt);
                    }
                    
                    bulkLogHtml(`✅ Completed: ${task.sceneId} Line ${task.lineId}`, "text-green-500");

                } catch (err) {
                    console.error(err);
                    bulkLogHtml(`❌ Failed: ${task.sceneId} Line ${task.lineId} - ${err.message}`, "text-red-500");
                }
                
                // Small delay to prevent rate limits
                await new Promise(r => setTimeout(r, 2000));
            }

            updateBulkProgress(100, "All tasks completed!");
            isBulkGenerating = false;
            btn.innerText = "✅ Done";
            btn.classList.remove('bg-green-600', 'hover:bg-green-500');
            btn.classList.add('bg-gray-600', 'cursor-not-allowed');
        }

        function updateBulkProgress(pct, text) {
            document.getElementById('bulk-progress-bar').style.width = `${pct}%`;
            document.getElementById('bulk-percentage').innerText = `${pct}%`;
            document.getElementById('bulk-status-text').innerText = text;
        }

        function bulkLogHtml(msg, colorClass = "text-gray-300") {
            const div = document.createElement('div');
            div.className = `mb-1 ${colorClass}`;
            div.innerText = msg;
            bulkLogContainer.appendChild(div);
            bulkLogContainer.scrollTop = bulkLogContainer.scrollHeight;
        }

        // ==========================================
        // 1.5 DOCUMENTATION MENUS LOGIC
        // ==========================================
        
        const docData = {
            real: [
                { title: "Meeting Output (18 Dec)", path: "../2_Real/18_dec_meeting_output.md" },
                { title: "Meeting Summary (18 Dec)", path: "../2_Real/18_dec_meeting_summary.md" },
                { title: "Read Me", path: "../2_Real/README.md" },
                { title: "Scene Plan (JPEG)", path: "../2_Real/Scene_post_production_Plan.jpeg" }
            ],
            environment: [
                { title: "Feedback Call Raw", path: "../3_Environment/18_dec_Feedback_call_raw.md" },
                { title: "Roadmap for Editors", path: "../3_Environment/roadmap-for-editors.md" },
                { title: "Google Drive Info", path: "../3_Environment/google_drive.md" },
                { title: "Read Me", path: "../3_Environment/README.md" }
            ],
            ui: [
                { title: "Read Me", path: "../4_UI/README.md" },
                { title: "Plan Post Prod (JPEG)", path: "../4_UI/Plan_post_production_2025-12-19 at 16.35.12.jpeg" },
                { title: "Captions Image 1 (JPEG)", path: "../4_UI/captions_Image 2025-12-19 at 17.37.54.jpeg" },
                { title: "Captions Image 2 (JPEG)", path: "../4_UI/captions_Image 2025-12-19 at 17.51.53.jpeg" },
                { title: "Gemini API Client (PNG)", path: "../4_UI/gemini_api_client_create.png" },
                { title: "Gemini Logs (PNG)", path: "../4_UI/gemini_logs.png" }
            ],
            formulas: [
                { title: "Scenes Formula", path: "../5_Formula/scenes_formula.md" },
                { title: "YAML HTML Logic", path: "../4_Formula/yaml_html_logic.md" },
                { title: "YAML Hosting Workflow", path: "../4_Formula/yaml_hosting_workflow.md" },
                { title: "Turn Off Deployments", path: "../5_Formula/turn_off_deployments.md" },
                { title: "Google OAuth Setup", path: "../4_Formula/google_oauth_setup.md" },
                { title: "Sanity Check", path: "../5_Formula/sanity_check_post_prod_plan.md" },
                { title: "Feedback Bias", path: "../5_Formula/feedback-bias-overestimate-ability.md" },
                { title: "Dunning-Kruger Mitigation", path: "../5_Formula/mitigation-dunningkruger.md" },
                { title: "Valley of Despair", path: "../5_Formula/valley-of-despair.md" },
                { title: "Project Health Report", path: "../5_Formula/project_health_check.md" },
                { title: "References", path: "../5_Formula/references.md" },
                { title: "Read Me (Formulas)", path: "../5_Formula/README.md" }
            ],
            symbols: [
                { title: "Producer Flow", path: "../6_Symbols/producer_flow.html" },
                { title: "Editor Flow", path: "../6_Symbols/editor_flow.html" },
                { title: "Artifact Plan", path: "../6_Symbols/post_prod_artifact_plan.html" },
                { title: "Scenes YAML", path: "../6_Symbols/scenes.yaml" },
                { title: "Template YAML", path: "../6_Symbols/template.yaml" },
                { title: "Styles CSS", path: "../6_Symbols/styles.css" },
                { title: "Read Me", path: "../6_Symbols/README.md" }
            ],
            semblance: [
                { title: "Read Me", path: "../7_Semblance/README.md" },
                { title: "Work Flow", path: "../7_Semblance/flow.md" },
                { title: "Upload Errors", path: "../7_Semblance/wrong_foldername_upload.md" }
            ],
            test: [
                { title: "Read Me", path: "../8_Test/README.md" },
                { title: "Test Turn Off Deployments", path: "../8_Test/test_deployment_settings.md" },
                { title: "Test Bulk Generation", path: "../8_Test/test_bulk_generation.md" },
                { title: "Test GitHub Save", path: "../8_Test/test_github_save.md" },
                { title: "Test Google Drive Upload", path: "../8_Test/test_google_drive_upload.md" },
                { title: "Test Stats Verification", path: "../8_Test/test_stats_verification.md" },
                { title: "Test API Key Validation", path: "../8_Test/test_api_key_validation.md" }
            ]
        };

        function getEmojiForDoc(title) {
            const lower = title.toLowerCase();
            // Images
            if (lower.includes('jpeg') || lower.includes('jpg') || lower.includes('png') || lower.includes('gif')) return '🖼️';
            
            if (lower.includes('read me')) return '📖';
            if (lower.includes('meeting')) return '🤝';
            if (lower.includes('feedback')) return '💭';
            if (lower.includes('roadmap')) return '🗺️';
            
            // Formula specific
            if (lower.includes('scene')) return '🎬';
            if (lower.includes('yaml')) return '⚙️';
            if (lower.includes('oauth') || lower.includes('setup')) return '🔐';
            if (lower.includes('sanity')) return '✅';
            if (lower.includes('bias') || lower.includes('despair') || lower.includes('dunning')) return '🧠';
            if (lower.includes('reference')) return '📚';
            if (lower.includes('deploy')) return '🛑';
            
            return '📄';
        }

        function initDocumentationMenus() {
            Object.keys(docData).forEach(key => {
                const items = docData[key];
                const list = document.getElementById(`menu-list-${key}`);
                if (!list) return;

                // Sort (Folders first maybe? For now A-Z)
                items.sort((a, b) => a.title.localeCompare(b.title));
                
                // Populate
                list.innerHTML = '';
                // wrapper for scrolling if needed
                const scrollWrapper = document.createElement('div');
                scrollWrapper.className = "p-2 space-y-1 max-h-80 overflow-y-auto";
                
                items.forEach(item => {
                    const emoji = getEmojiForDoc(item.title);
                    const btn = document.createElement('button');
                    btn.className = "w-full text-left text-xs text-gray-300 hover:bg-gray-700 hover:text-white px-2 py-1.5 rounded flex items-center gap-2 relative z-50 truncate transition border-b border-gray-700/50";
                    btn.innerHTML = `<span class="opacity-70">${emoji}</span> <span>${item.title}</span>`;
                    btn.onclick = () => openDocModal(item.path, item.title);
                    scrollWrapper.appendChild(btn);
                });
                
                list.appendChild(scrollWrapper);
            });
        }

        function toggleDocMenu(key) {
            // Close all others
            const allKeys = ['actions-menu', 'links-menu', ...Object.keys(docData).map(k => `menu-list-${k}`)];
            
            // Current list ID
            const currentListId = `menu-list-${key}`;
            
            allKeys.forEach(id => {
               if (id !== currentListId) {
                   const el = document.getElementById(id);
                   if (el) {
                       el.classList.add('hidden');
                       el.classList.remove('flex');
                   }
               } 
            });

            // Toggle current
            const menu = document.getElementById(currentListId);
            if (menu) {
                menu.classList.toggle('hidden');
                menu.classList.toggle('flex');
            }
        }
        
        // Reused Modal Logic (renamed slightly for clarity but keeping ID same)
        async function openDocModal(path, title) {
            const modal = document.getElementById('formula-modal');
            const titleEl = document.getElementById('formula-modal-title');
            const contentEl = document.getElementById('formula-content');
            
            // Add Copy Path Button
            const emoji = getEmojiForDoc(title);
            titleEl.innerHTML = `
                <span class="flex items-center gap-2">
                    ${emoji} ${title}
                </span>
                <button onclick="copyFormulaPath('${path}', this)" class="ml-4 text-[10px] bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded border border-gray-600 flex items-center gap-1 transition">
                    📋 Copy Path
                </button>
            `;
            
            contentEl.innerHTML = '<div class="flex items-center justify-center p-8"><div class="loader" style="display:block"></div></div>';
            modal.classList.remove('hidden');
            
            // Check if Image
            const lowerPath = path.toLowerCase();
            const isImage = lowerPath.endsWith('.png') || lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg') || lowerPath.endsWith('.gif') || lowerPath.endsWith('.webp');

            if (isImage) {
                 contentEl.innerHTML = `
                    <div class="flex flex-col items-center">
                        <img src="${path}" alt="${title}" class="max-w-full h-auto rounded border border-gray-700 shadow-lg mb-4">
                        <a href="${path}" download class="text-xs bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded">Download Image</a>
                    </div>
                 `;
            } else {
                try {
                    const response = await fetch(path);
                    if (!response.ok) throw new Error(`HTTP ${response.status} - Not Found`);
                    const text = await response.text();
                    contentEl.innerHTML = marked.parse(text);
                    contentEl.parentElement.scrollTop = 0;
                } catch (error) {
                    console.error("Doc load error:", error);
                    contentEl.innerHTML = `
                        <div class="bg-red-900/30 border border-red-800 rounded p-4 text-center">
                            <h4 class="text-red-400 font-bold mb-2">Failed to load content</h4>
                            <p class="text-xs text-red-300 mb-2">${error.message}</p>
                            <div class="mt-4 text-[10px] font-mono bg-black/50 p-2 rounded text-left overflow-auto">
                                Path: ${path}
                            </div>
                        </div>
                    `;
                }
            }
        }

        // Keeping these helpers compatible or redundant
        function openFormulaModal(path, title) { openDocModal(path, title); } 

        // ... existing Sort/Emoji logic replaced above ...

        function copyFormulaPath(path, btn) {
            navigator.clipboard.writeText(path).then(() => {
                const originalHTML = btn.innerHTML;
                btn.innerHTML = "✅ Copied!";
                btn.classList.add('text-green-400', 'border-green-500');
                
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                    btn.classList.remove('text-green-400', 'border-green-500');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy path:', err);
                btn.innerHTML = "❌ Error";
            });
        }

        function closeFormulaModal() {
             document.getElementById('formula-modal').classList.add('hidden');
        }
        
        // Removed toggleFormulasMenu as it is replaced by toggleDocMenu


        // ==========================================
        // LIST MODELS FUNCTIONALITY
        // ==========================================
        let allModels = []; // Store fetched models for filtering

        async function openListModelsModal() {
            const modal = document.getElementById('models-modal');
            modal.classList.remove('hidden');
            
            const apiKey = localStorage.getItem('google_api_key');
            if (!apiKey) {
                renderModelsError("No API Key found. Please enter your Google API Key in the top right.");
                return;
            }

            try {
                await fetchModels(apiKey);
            } catch (error) {
                console.error("Error fetching models:", error);
                renderModelsError("Failed to fetch models. Check your API key and network connection.");
            }
        }

        function closeModelsModal() {
            document.getElementById('models-modal').classList.add('hidden');
        }

        async function fetchModels(key) {
            const tbody = document.getElementById('models-table-body');
            tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center italic">Fetching models from Google...</td></tr>';

            const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=100`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            if (data.models) {
                allModels = data.models; // Store for filtering
                renderModels(allModels);
            } else {
                throw new Error("No models found in response");
            }
        }

        function renderModels(models) {
            const tbody = document.getElementById('models-table-body');
            const countSpan = document.getElementById('model-count');
            
            tbody.innerHTML = '';
            countSpan.innerText = `${models.length} human-friendly models found`;

            if (models.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center italic text-gray-500">No models match your search.</td></tr>';
                return;
            }

            models.forEach(model => {
                const name = model.name.replace('models/', '');
                const displayName = model.displayName || name;
                const version = model.version || '-';
                const inputTokenLimit = model.inputTokenLimit || '-';
                const outputTokenLimit = model.outputTokenLimit || '-';
                const supportedGenMethods = model.supportedGenerationMethods ? model.supportedGenerationMethods.join(', ') : '-';

                const tr = document.createElement('tr');
                tr.className = "hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-0";
                tr.innerHTML = `
                    <td class="p-3 font-mono text-blue-300 select-all">${name}</td>
                    <td class="p-3 text-white font-bold">${displayName}</td>
                    <td class="p-3 font-mono text-gray-400">${version}</td>
                    <td class="p-3 text-xs">
                        <div class="flex flex-col gap-1">
                           <span title="Input Tokens">📥 ${inputTokenLimit}</span>
                           <span title="Output Tokens">📤 ${outputTokenLimit}</span>
                        </div>
                    </td>
                     <td class="p-3 text-[10px] text-gray-500 max-w-xs truncate" title="${supportedGenMethods}">
                        ${supportedGenMethods}
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        function renderModelsError(msg) {
            const tbody = document.getElementById('models-table-body');
            tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-400 font-bold">❌ ${msg}</td></tr>`;
        }

        function filterModels(query) {
            if (!query) {
                renderModels(allModels);
                return;
            }
            
            const lowerQuery = query.toLowerCase();
            const filtered = allModels.filter(m => 
                m.name.toLowerCase().includes(lowerQuery) || 
                (m.displayName && m.displayName.toLowerCase().includes(lowerQuery))
            );
            renderModels(filtered);
        }

        window.addEventListener('DOMContentLoaded', () => {
            initApp();
            initDocumentationMenus();
        });
