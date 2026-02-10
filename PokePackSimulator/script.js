document.addEventListener('DOMContentLoaded', () => {
    // Buttons
    const btnOpen1 = document.getElementById('btnOpen1');
    const btnOpen10 = document.getElementById('btnOpen10');
    const btnReopen = document.getElementById('btnReopen');
    const btnBackToHome = document.getElementById('btnBackToHome');

    // Screens elements
    const packContainer = document.getElementById('packContainer');
    const packTop = document.getElementById('packTop');
    const controlsContainer = document.getElementById('controlsContainer');
    const cardRevealScreen = document.getElementById('cardRevealScreen');
    const cardsGrid = document.getElementById('cardsGrid');
    const sessionStatsBar = document.getElementById('sessionStatsBar');
    const desiredStatsBar = document.getElementById('desiredStatsBar');

    // Settings elements
    const btnProb = document.getElementById('btnProb');
    const settingsScreen = document.getElementById('settingsScreen');
    const probInput = document.getElementById('probInput');
    const godProbInput = document.getElementById('godProbInput');
    const btnSaveSettings = document.getElementById('btnSaveSettings');
    const btnCancelSettings = document.getElementById('btnCancelSettings');

    // State
    // State
    let sixCardProb = 8; // Default 8%
    let godPackProb = 0.05; // Default 0.05% (God Pack)

    // Rarity Counts (Default)
    let rarityCounts = {
        '👑': 1,
        '🌈🌈': 4,
        '🌈': 10,
        '☆☆☆': 1,
        '☆☆': 14,
        '☆': 7,
        '♢♢♢♢': 6,
        '♢♢♢': 6,
        '♢♢': 20,
        '♢': 25
    };

    // Desired Numbers (Default empty)
    let rarityDesired = {
        '👑': [],
        '🌈🌈': [],
        '🌈': [],
        '☆☆☆': [],
        '☆☆': [],
        '☆': [],
        '♢♢♢♢': [],
        '♢♢♢': [],
        '♢♢': [],
        '♢': []
    };

    // State for Re-open
    let lastOpenedCount = 1;

    // Session Stats State
    let sessionPackCount = 0;

    // Session Desired Card Stats: { 'rarity-number': count }
    let sessionDesiredCards = {};

    // God Pack Mode: 'uniform', 'no-rainbow', 'custom'
    let godPackMode = 'no-rainbow'; // Default: exclude rainbow cards

    // Function to handle pack opening
    function openPack(count) {
        lastOpenedCount = count; // Memorize count
        sessionPackCount = count; // Reset/Init session count for new open from home
        sessionDesiredCards = {}; // Reset desired card tracking

        if (packContainer.classList.contains('shake') || packTop.classList.contains('torn')) {
            return; // Animation in progress
        }

        // Ensure reveal screen is hidden and pack is visible (for re-open case)
        cardRevealScreen.classList.add('hidden');
        packContainer.classList.remove('hidden');
        // controlsContainer state is preserved (visible if home, hidden if reopen)

        // 1. Shake animation
        packContainer.classList.add('shake');

        // 2. Tear animation after shake
        setTimeout(() => {
            packContainer.classList.remove('shake');
            packTop.classList.add('torn');

            // 3. Transition to card reveal screen
            setTimeout(() => {
                showCardRevealScreen(count);

                // Reset pack state in background
                setTimeout(() => {
                    packTop.classList.remove('torn');
                }, 500);
            }, 800);

        }, 500);
    }

    function reopenPack() {
        // Increment session count
        sessionPackCount += lastOpenedCount;

        // Skip animation: Directly show results
        showCardRevealScreen(lastOpenedCount);

        // Reset pack state so it's fresh when going back to home
        packContainer.classList.remove('shake');
        packTop.classList.remove('torn');
    }

    function showCardRevealScreen(packCount) {
        // Hide home screen elements
        packContainer.classList.add('hidden');
        controlsContainer.classList.add('hidden');

        // Show Stats Bars (Fixed position)
        if (sessionStatsBar) {
            sessionStatsBar.classList.remove('hidden');
            document.querySelector('.main-content').classList.add('has-stats');
        }
        if (desiredStatsBar) {
            desiredStatsBar.classList.remove('hidden');
        }

        // Show card reveal screen
        cardRevealScreen.classList.remove('hidden');

        // Update Button Text based on pack count
        if (packCount > 1) {
            btnReopen.textContent = 'もう一回10パック開封';
            cardRevealScreen.classList.remove('is-single-pack');
        } else {
            btnReopen.textContent = 'もう一度開封する';
            cardRevealScreen.classList.add('is-single-pack');
        }

        // Generate cards for N packs
        generateCards(packCount);

        // Update Stats Bar
        updateStatsBar();
        updateDesiredStatsBar();

        // Reset scroll position to top (Done after generation to work for both re-open and home return)
        cardRevealScreen.scrollTop = 0;
    }

    function getRarity(table) {
        const rand = Math.random() * 100;
        let cumulative = 0;
        for (const item of table) {
            cumulative += item.rate;
            if (rand < cumulative) {
                return item.rarity;
            }
        }
        return table[table.length - 1].rarity; // Fallback
    }

    function getGodPackCard() {
        if (godPackMode === 'custom') {
            // Mode 3: Custom probability using existing table
            return getRarity(rarityTableGodPack);
        }

        // Mode 1 & 2: Uniform card probability
        const targetRarities = godPackMode === 'uniform'
            ? ['👑', '🌈🌈', '🌈', '☆☆☆', '☆☆', '☆']  // Mode 1: All cards
            : ['👑', '☆☆☆', '☆☆', '☆'];                // Mode 2: No rainbow

        // Build card pool from rarityCounts
        const cardPool = [];
        for (const rarity of targetRarities) {
            const count = rarityCounts[rarity] || 0;
            for (let i = 1; i <= count; i++) {
                cardPool.push({ rarity, cardNum: i });
            }
        }

        if (cardPool.length === 0) {
            // Fallback if no cards available
            return '♢';
        }

        // Select random card from pool
        const selectedCard = cardPool[Math.floor(Math.random() * cardPool.length)];
        return selectedCard.rarity;
    }

    function generateCards(packCount) {
        cardsGrid.innerHTML = ''; // Clear existing

        for (let p = 0; p < packCount; p++) {
            // Priority 1: God Pack (0.05%)
            // Priority 2: 6-Card Pack (User Setting %)
            // Priority 3: Normal 5-Card Pack

            const isGodPack = (Math.random() * 100) < godPackProb;
            let isSixCards = false;

            if (!isGodPack) {
                isSixCards = (Math.random() * 100) < sixCardProb;
            }

            const cardNumInPack = isSixCards ? 6 : 5;

            // For single pack, add cards directly to grid (original layout)
            // For multiple packs, wrap each pack in a container
            let container;
            if (packCount === 1) {
                container = cardsGrid; // Add directly to grid
            } else {
                container = document.createElement('div');
                container.className = 'pack-result-row';
            }

            // [New] Variables to track desired card status for the current pack
            let packHasDesired = false;
            let firstCardInPack = null;

            for (let i = 0; i < cardNumInPack; i++) {
                const card = document.createElement('div');
                card.className = 'white-card';

                // Determine Rarity
                let rarity = '';

                if (isGodPack) {
                    // God Pack Logic: Use mode-based selection
                    rarity = getGodPackCard();
                } else if (cardNumInPack === 5) {
                    // 5-card pack logic
                    if (i < 3) {
                        rarity = '♢';
                    } else if (i === 3) {
                        rarity = getRarity(rarityTable4th);
                    } else if (i === 4) {
                        rarity = getRarity(rarityTable5th);
                    }
                } else {
                    // 6-card pack logic
                    if (i < 3) {
                        rarity = '♢';
                    } else if (i === 3) {
                        // 4th card (Bottom Left)
                        rarity = getRarity(rarityTable6Pack4th);
                    } else if (i === 4) {
                        // 5th card (Bottom Center)
                        rarity = getRarity(rarityTable6Pack5th);
                    } else if (i === 5) {
                        // 6th card (Bottom Right)
                        rarity = getRarity(rarityTable6Pack6th);
                    }
                }

                // Apply rarity-specific CSS class for custom images
                const rarityClassMap = {
                    '👑': 'rarity-crown',
                    '🌈🌈': 'rarity-rainbow2',
                    '🌈': 'rarity-rainbow',
                    '☆☆☆': 'rarity-star3',
                    '☆☆': 'rarity-star2',
                    '☆': 'rarity-star1',
                    '♢♢♢♢': 'rarity-dia4',
                    '♢♢♢': 'rarity-dia3'
                };

                if (rarityClassMap[rarity]) {
                    card.classList.add(rarityClassMap[rarity]);
                }

                // Determine Card Number (1 to Max)
                const maxCount = rarityCounts[rarity] || 99; // Default fallback
                const cardNum = Math.floor(Math.random() * maxCount) + 1;

                // Check if desired
                const isDesired = rarityDesired[rarity] && rarityDesired[rarity].includes(cardNum);

                // Create Number Label (Center)
                const numberLabel = document.createElement('div');
                numberLabel.className = 'card-number';

                const currentSpan = document.createElement('span');
                currentSpan.className = 'num-current';
                currentSpan.textContent = cardNum;
                if (isDesired) {
                    currentSpan.classList.add('desired-match');
                }

                const sepSpan = document.createElement('span');
                sepSpan.className = 'num-separator';
                sepSpan.textContent = '/';

                const totalSpan = document.createElement('span');
                totalSpan.className = 'num-total';
                totalSpan.textContent = maxCount;

                numberLabel.appendChild(currentSpan);
                numberLabel.appendChild(sepSpan);
                numberLabel.appendChild(totalSpan);

                card.appendChild(numberLabel);

                // Create Rarity Label (Bottom)
                const rarityLabel = document.createElement('div');
                rarityLabel.className = 'card-rarity';
                rarityLabel.textContent = rarity;
                card.appendChild(rarityLabel);

                // [New] Track the first card wrapper element
                if (i === 0) {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'first-card-wrapper';
                    wrapper.appendChild(card);
                    container.appendChild(wrapper);
                    firstCardInPack = wrapper; // Use wrapper as the target for the label
                } else {
                    container.appendChild(card);
                }

                // [New] Update pack desired status if this card is desired
                if (isDesired) {
                    packHasDesired = true;

                    // Track this desired card for session stats
                    const key = `${rarity}-${cardNum}`;
                    if (!sessionDesiredCards[key]) {
                        sessionDesiredCards[key] = { rarity, number: cardNum, count: 0 };
                    }
                    sessionDesiredCards[key].count++;
                }
            }

            // [New] If the pack contains a desired card, append the label to the first card wrapper
            if (packHasDesired && firstCardInPack) {
                const label = document.createElement('div');
                label.className = 'desired-pack-label';
                label.textContent = 'ほしいカード！';
                firstCardInPack.appendChild(label);
            }

            // [New] If the pack is a God Pack (rare pack), append the rare pack label
            if (isGodPack && firstCardInPack) {
                const rareLabel = document.createElement('div');
                rareLabel.className = 'rare-pack-label';
                rareLabel.textContent = 'レア封入！';
                firstCardInPack.appendChild(rareLabel);
            }

            // For multiple packs, append the container to grid
            if (packCount > 1) {
                cardsGrid.appendChild(container);
            }
        }
    }

    // Rarity Definitions (Mutable for settings)
    let rarityTable4th = [
        { rarity: '👑', rate: 0.040 },
        { rarity: '🌈🌈', rate: 0.333 },
        { rarity: '🌈', rate: 0.714 },
        { rarity: '☆☆☆', rate: 0.222 },
        { rarity: '☆☆', rate: 0.500 },
        { rarity: '☆', rate: 2.572 },
        { rarity: '♢♢♢♢', rate: 1.666 },
        { rarity: '♢♢♢', rate: 4.952 },
        { rarity: '♢♢', rate: 89.001 }
    ];

    let rarityTable5th = [
        { rarity: '👑', rate: 0.160 },
        { rarity: '🌈🌈', rate: 1.333 },
        { rarity: '🌈', rate: 2.857 },
        { rarity: '☆☆☆', rate: 0.888 },
        { rarity: '☆☆', rate: 2.000 },
        { rarity: '☆', rate: 10.288 },
        { rarity: '♢♢♢♢', rate: 6.664 },
        { rarity: '♢♢♢', rate: 19.810 },
        { rarity: '♢♢', rate: 56.000 }
    ];

    // 6-Card Pack Tables
    let rarityTable6Pack4th = [ // Same as 5-pack 4th
        { rarity: '👑', rate: 0.040 },
        { rarity: '🌈🌈', rate: 0.333 },
        { rarity: '🌈', rate: 0.714 },
        { rarity: '☆☆☆', rate: 0.222 },
        { rarity: '☆☆', rate: 0.500 },
        { rarity: '☆', rate: 2.572 },
        { rarity: '♢♢♢♢', rate: 1.666 },
        { rarity: '♢♢♢', rate: 4.952 },
        { rarity: '♢♢', rate: 89.001 }
    ];

    let rarityTable6Pack5th = [ // Same as 5-pack 5th
        { rarity: '👑', rate: 0.160 },
        { rarity: '🌈🌈', rate: 1.333 },
        { rarity: '🌈', rate: 2.857 },
        { rarity: '☆☆☆', rate: 0.888 },
        { rarity: '☆☆', rate: 2.000 },
        { rarity: '☆', rate: 10.288 },
        { rarity: '♢♢♢♢', rate: 6.664 },
        { rarity: '♢♢♢', rate: 19.810 },
        { rarity: '♢♢', rate: 56.000 }
    ];

    let rarityTable6Pack6th = [ // New table for bottom right in 6-pack
        { rarity: '🌈🌈', rate: 10.0 },
        { rarity: '🌈', rate: 20.0 },
        { rarity: '☆', rate: 30.0 },
        { rarity: '♢♢♢', rate: 40.0 }
    ];

    // God Pack Table (Used for all 5 cards)
    let rarityTableGodPack = [
        { rarity: '👑', rate: 3.030 },
        { rarity: '🌈🌈', rate: 12.121 },
        { rarity: '🌈', rate: 30.303 },
        { rarity: '☆☆☆', rate: 3.030 },
        { rarity: '☆☆', rate: 36.363 },
        { rarity: '☆', rate: 15.151 }
    ];

    // Stats Logic
    function updateStatsBar() {
        const costHourglass = sessionPackCount * 12;
        const costGold = sessionPackCount * 6;
        const costYen = sessionPackCount * 150;

        // Clear existing
        sessionStatsBar.innerHTML = '';

        // Helper to adjust number formatting if needed (currently plain)
        // Format: _パック開封　__⌛　__💰　__円

        const items = [
            { text: `${sessionPackCount}パック開封` },
            { text: `${costHourglass}⌛` },
            { text: `${costGold}💰` },
            { text: `${costYen}円` }
        ];

        items.forEach(item => {
            const span = document.createElement('span');
            span.className = 'stats-item';
            span.textContent = item.text;
            sessionStatsBar.appendChild(span);
        });

        // [New] Dynamic font sizing for mobile
        adjustFontSizeToFit(sessionStatsBar);
    }

    function updateDesiredStatsBar() {
        // Clear existing
        desiredStatsBar.innerHTML = '';

        // Create left side label "ほしい!!"
        const labelSpan = document.createElement('span');
        labelSpan.className = 'desired-label';
        labelSpan.textContent = 'ほしい!!';
        desiredStatsBar.appendChild(labelSpan);

        // Create container for stats items (to allow flex layout)
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'desired-items';
        desiredStatsBar.appendChild(itemsContainer);

        // Get all pulled desired cards and sort them
        const pulledCards = Object.values(sessionDesiredCards).filter(card => card.count > 0);

        if (pulledCards.length > 0) {
            // Sort by rarity order
            const rarityOrder = ['👑', '🌈🌈', '🌈', '☆☆☆', '☆☆', '☆', '♢♢♢♢', '♢♢♢', '♢♢', '♢'];
            pulledCards.sort((a, b) => {
                const rarityOrderIdx = (r) => rarityOrder.indexOf(r);
                const rarityDiff = rarityOrderIdx(a.rarity) - rarityOrderIdx(b.rarity);
                if (rarityDiff !== 0) return rarityDiff;
                return a.number - b.number;
            });

            // Create display text for each pulled card
            pulledCards.forEach(card => {
                const cardSpan = document.createElement('span');
                cardSpan.className = 'stats-item';
                cardSpan.textContent = `${card.rarity}${card.number}×${card.count}`;
                itemsContainer.appendChild(cardSpan);
            });
        } else {
            // [New] Show "Nothing" message if no desired cards were pulled
            const emptySpan = document.createElement('span');
            emptySpan.className = 'empty-text';
            emptySpan.textContent = '何もない…';
            itemsContainer.appendChild(emptySpan);
        }

        // [New] Dynamic font sizing for mobile
        adjustFontSizeToFit(desiredStatsBar);
    }

    // Helper: Dynamic font sizing for mobile (<= 480px)
    function adjustFontSizeToFit(element) {
        if (window.innerWidth > 480) {
            element.style.fontSize = ''; // Reset on PC
            return;
        }

        // Reset to default to measure correctly
        element.style.fontSize = '0.95rem';
        element.style.whiteSpace = 'nowrap'; // Ensure no wrapping for measurement

        const scrollWidth = element.scrollWidth;
        const clientWidth = element.clientWidth;

        if (scrollWidth > clientWidth) {
            const ratio = clientWidth / scrollWidth;
            // Apply ratio with a slight buffer (0.95), minimum 0.5rem
            let newSize = 0.95 * ratio * 0.95;
            newSize = Math.max(newSize, 0.5);
            element.style.fontSize = `${newSize}rem`;
        }
    }

    function resetToHome() {
        // Hide card screen
        cardRevealScreen.classList.add('hidden');

        // Hide Stats Bars
        if (sessionStatsBar) {
            sessionStatsBar.classList.add('hidden');
            document.querySelector('.main-content').classList.remove('has-stats');
        }
        if (desiredStatsBar) {
            desiredStatsBar.classList.add('hidden');
        }

        // Reset scroll position for next time

        // Reset scroll position for next time
        cardRevealScreen.scrollTop = 0;

        // Show home screen elements
        packContainer.classList.remove('hidden');
        controlsContainer.classList.remove('hidden');
    }

    // Settings Logic
    const raritySettingsContainer = document.getElementById('raritySettingsContainer');

    function renderRarityInputs(table, title, prefix) {
        const section = document.createElement('div');
        section.className = 'rarity-section';

        const heading = document.createElement('h3');
        heading.textContent = title;
        section.appendChild(heading);

        table.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'rarity-row';

            const label = document.createElement('label');
            label.textContent = item.rarity;

            const input = document.createElement('input');
            input.type = 'number';
            input.step = '0.001';
            input.min = '0';
            input.max = '100';
            input.value = item.rate;
            input.id = `${prefix}_${index}`; // unique id

            const unit = document.createElement('span');
            unit.textContent = '%';

            row.appendChild(label);
            row.appendChild(input);
            row.appendChild(unit);
            section.appendChild(row);
        });

        return section;
    }

    function openSettings() {
        probInput.value = sixCardProb;
        godProbInput.value = godPackProb;

        // Regenerate rarity settings
        raritySettingsContainer.innerHTML = '';

        // 5-Card Pack Settings
        const header5 = document.createElement('h2');
        header5.textContent = '5枚封入時の設定';
        header5.style.fontSize = '1.1rem';
        header5.style.marginTop = '20px';
        raritySettingsContainer.appendChild(header5);

        raritySettingsContainer.appendChild(renderRarityInputs(rarityTable4th, '4枚目 (下段左)', 'r4'));
        raritySettingsContainer.appendChild(renderRarityInputs(rarityTable5th, '5枚目 (下段右)', 'r5'));

        // 6-Card Pack Settings
        const header6 = document.createElement('h2');
        header6.textContent = '6枚封入時の設定';
        header6.style.fontSize = '1.1rem';
        header6.style.marginTop = '20px';
        raritySettingsContainer.appendChild(header6);

        raritySettingsContainer.appendChild(renderRarityInputs(rarityTable6Pack4th, '4枚目 (下段左)', 'r6_4'));
        raritySettingsContainer.appendChild(renderRarityInputs(rarityTable6Pack5th, '5枚目 (下段中)', 'r6_5'));
        raritySettingsContainer.appendChild(renderRarityInputs(rarityTable6Pack6th, '6枚目 (下段右)', 'r6_6'));

        // God Pack Settings
        const headerGod = document.createElement('h2');
        headerGod.textContent = 'レア封入時の設定';
        headerGod.style.fontSize = '1.1rem';
        headerGod.style.marginTop = '20px';
        raritySettingsContainer.appendChild(headerGod);

        // God Pack Mode Selector (Radio Buttons)
        const modeSelector = document.createElement('div');
        modeSelector.className = 'god-pack-mode-selector';
        modeSelector.id = 'godPackModeSelector';

        const modes = [
            { value: 'uniform', label: '全カード均等' },
            { value: 'no-rainbow', label: '🌈系除外（デフォルト）' },
            { value: 'custom', label: 'カスタム確率' }
        ];

        modes.forEach(mode => {
            const label = document.createElement('label');
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'godPackMode';
            radio.value = mode.value;
            radio.checked = (godPackMode === mode.value);

            radio.addEventListener('change', () => {
                godPackMode = mode.value;
                updateGodPackInputsState();
            });

            label.appendChild(radio);
            label.appendChild(document.createTextNode(' ' + mode.label));
            modeSelector.appendChild(label);
        });

        raritySettingsContainer.appendChild(modeSelector);

        const godInputsSection = renderRarityInputs(rarityTableGodPack, '全カード共通', 'god');
        godInputsSection.id = 'godPackInputsSection';
        raritySettingsContainer.appendChild(godInputsSection);

        // Update inputs state based on current mode
        updateGodPackInputsState();

        packContainer.classList.add('hidden');
        controlsContainer.classList.add('hidden');
        settingsScreen.classList.remove('hidden');
        // Auto-focus only, no select
        setTimeout(() => probInput.focus(), 100);
    }

    function closeSettings() {
        settingsScreen.classList.add('hidden');
        packContainer.classList.remove('hidden');
        controlsContainer.classList.remove('hidden');
    }

    function updateGodPackInputsState() {
        const godInputsSection = document.getElementById('godPackInputsSection');
        if (!godInputsSection) return;

        const inputs = godInputsSection.querySelectorAll('input[type="number"]');
        const isCustomMode = (godPackMode === 'custom');

        inputs.forEach(input => {
            input.disabled = !isCustomMode;
            input.style.opacity = isCustomMode ? '1' : '0.5';
            input.style.cursor = isCustomMode ? 'text' : 'not-allowed';
        });
    }

    function updateTableFromInputs(table, prefix) {
        table.forEach((item, index) => {
            const input = document.getElementById(`${prefix}_${index}`);
            if (input) {
                const val = parseFloat(input.value);
                if (!isNaN(val) && val >= 0) {
                    item.rate = val;
                }
            }
        });
    }

    function saveSettings() {
        // Save 6-card prob
        const val = parseFloat(probInput.value);
        if (!isNaN(val) && val >= 0 && val <= 100) {
            sixCardProb = val;
        } else {
            alert('6枚封入率は0から100の間の数値を入力してください');
            return;
        }

        // Save God Pack prob
        const godVal = parseFloat(godProbInput.value);
        if (!isNaN(godVal) && godVal >= 0 && godVal <= 100) {
            godPackProb = godVal;
        } else {
            alert('レア封入率は0から100の間の数値を入力してください');
            return;
        }

        // Save Rarity Tables (5 cards)
        updateTableFromInputs(rarityTable4th, 'r4');
        updateTableFromInputs(rarityTable5th, 'r5');

        // Save Rarity Tables (6 cards)
        updateTableFromInputs(rarityTable6Pack4th, 'r6_4');
        updateTableFromInputs(rarityTable6Pack5th, 'r6_5');
        updateTableFromInputs(rarityTable6Pack6th, 'r6_6');

        // Save God Pack Table
        updateTableFromInputs(rarityTableGodPack, 'god');

        saveActiveSettings(); // Save to localStorage for persistence
        closeSettings();
    }

    // --- Count Settings Logic ---
    const countSettingsScreen = document.getElementById('countSettingsScreen');
    const countSettingsContainer = document.getElementById('countSettingsContainer');
    const btnSaveCountSettings = document.getElementById('btnSaveCountSettings');
    const btnCancelCountSettings = document.getElementById('btnCancelCountSettings');

    function openCountSettings() {
        renderCountInputs();
        packContainer.classList.add('hidden');
        controlsContainer.classList.add('hidden');
        countSettingsScreen.classList.remove('hidden');
    }

    function closeCountSettings() {
        countSettingsScreen.classList.add('hidden');
        packContainer.classList.remove('hidden');
        controlsContainer.classList.remove('hidden');
    }

    function renderCountInputs() {
        countSettingsContainer.innerHTML = '';
        Object.keys(rarityCounts).forEach(rarity => {
            const row = document.createElement('div');
            row.className = 'rarity-row row-count-setting'; // Added class for easier styling

            // Rarity Label (Left)
            const label = document.createElement('label');
            label.textContent = rarity;
            label.className = 'rarity-label';

            // Count Input Group
            const countGroup = document.createElement('div');
            countGroup.className = 'count-group';

            const inputCount = document.createElement('input');
            inputCount.type = 'number';
            inputCount.min = '1';
            inputCount.value = rarityCounts[rarity];
            inputCount.id = `count_${rarity}`;
            inputCount.className = 'input-count';

            const unit = document.createElement('span');
            unit.textContent = '枚';

            countGroup.appendChild(inputCount);
            countGroup.appendChild(unit);

            // Desired Input Group
            const desiredGroup = document.createElement('div');
            desiredGroup.className = 'desired-group';

            const desiredLabel = document.createElement('span');
            desiredLabel.textContent = 'ほしい';
            // CSS handles styles now

            const inputDesired = document.createElement('input');
            inputDesired.type = 'text';
            inputDesired.placeholder = '例: 1,5,10';
            // Join array to string for display
            inputDesired.value = (rarityDesired[rarity] || []).join(',');
            inputDesired.id = `desired_${rarity}`;
            inputDesired.className = 'input-desired';

            desiredGroup.appendChild(desiredLabel);
            desiredGroup.appendChild(inputDesired);

            row.appendChild(label);
            row.appendChild(countGroup);
            row.appendChild(desiredGroup);
            countSettingsContainer.appendChild(row);
        });
    }

    function saveCountSettings() {
        let valid = true;

        // Update values
        Object.keys(rarityCounts).forEach(rarity => {
            // Save Counts
            const inputCount = document.getElementById(`count_${rarity}`);
            if (inputCount) {
                const val = parseInt(inputCount.value);
                if (!isNaN(val) && val > 0) {
                    rarityCounts[rarity] = val;
                } else {
                    valid = false;
                }
            }

            // Save Desired Numbers
            const inputDesired = document.getElementById(`desired_${rarity}`);
            if (inputDesired) {
                const text = inputDesired.value.trim();
                let nums = [];
                if (text) {
                    // Split by comma, trim, parse int, filter valids
                    nums = text.split(',')
                        .map(s => parseInt(s.trim()))
                        .filter(n => !isNaN(n) && n > 0);
                }
                rarityDesired[rarity] = nums;
            } else {
                rarityDesired[rarity] = [];
            }
        });

        if (!valid) {
            alert('全ての枚数に1以上の数値を入力してください');
            return;
        }

        saveActiveSettings(); // Save to localStorage for persistence
        closeCountSettings();
    }

    // --- Preset Logic ---
    const DEFAULT_PRESETS = {
        "未知なる水域": {
            "sixCardProb": 8,
            "sixCardProbInput": 8,
            "rarityTable4th": [
                { "rarity": "👑", "rate": 0.04 },
                { "rarity": "🌈🌈", "rate": 0.333 },
                { "rarity": "🌈", "rate": 0.714 },
                { "rarity": "☆☆☆", "rate": 0.222 },
                { "rarity": "☆☆", "rate": 0.5 },
                { "rarity": "☆", "rate": 2.572 },
                { "rarity": "♢♢♢♢", "rate": 1.666 },
                { "rarity": "♢♢♢", "rate": 4.952 },
                { "rarity": "♢♢", "rate": 89.001 }
            ],
            "rarityTable5th": [
                { "rarity": "👑", "rate": 0.16 },
                { "rarity": "🌈🌈", "rate": 1.333 },
                { "rarity": "🌈", "rate": 2.857 },
                { "rarity": "☆☆☆", "rate": 0.888 },
                { "rarity": "☆☆", "rate": 2 },
                { "rarity": "☆", "rate": 10.288 },
                { "rarity": "♢♢♢♢", "rate": 6.664 },
                { "rarity": "♢♢♢", "rate": 19.81 },
                { "rarity": "♢♢", "rate": 56 }
            ]
        },
        "紅蓮ブレイズ": {
            "sixCardProb": 5.238,
            "sixCardProbInput": 5.238,
            "godPackProb": 100,
            "godPackProbInput": 0.05,
            "rarityTable4th": [
                { "rarity": "👑", "rate": 0.04 },
                { "rarity": "🌈🌈", "rate": 0.333 },
                { "rarity": "🌈", "rate": 0.714 },
                { "rarity": "☆☆☆", "rate": 0.222 },
                { "rarity": "☆☆", "rate": 0.5 },
                { "rarity": "☆", "rate": 2.572 },
                { "rarity": "♢♢♢♢", "rate": 1.666 },
                { "rarity": "♢♢♢", "rate": 4.952 },
                { "rarity": "♢♢", "rate": 89.001 }
            ],
            "rarityTable5th": [
                { "rarity": "👑", "rate": 0.16 },
                { "rarity": "🌈🌈", "rate": 1.333 },
                { "rarity": "🌈", "rate": 2.857 },
                { "rarity": "☆☆☆", "rate": 0.888 },
                { "rarity": "☆☆", "rate": 2 },
                { "rarity": "☆", "rate": 10.288 },
                { "rarity": "♢♢♢♢", "rate": 6.664 },
                { "rarity": "♢♢♢", "rate": 19.81 },
                { "rarity": "♢♢", "rate": 56 }
            ],
            "rarityTable6Pack4th": [
                { "rarity": "👑", "rate": 0.04 },
                { "rarity": "🌈🌈", "rate": 0.333 },
                { "rarity": "🌈", "rate": 0.714 },
                { "rarity": "☆☆☆", "rate": 0.222 },
                { "rarity": "☆☆", "rate": 0.5 },
                { "rarity": "☆", "rate": 2.572 },
                { "rarity": "♢♢♢♢", "rate": 1.666 },
                { "rarity": "♢♢♢", "rate": 4.952 },
                { "rarity": "♢♢", "rate": 89.001 }
            ],
            "rarityTable6Pack5th": [
                { "rarity": "👑", "rate": 0.16 },
                { "rarity": "🌈🌈", "rate": 1.333 },
                { "rarity": "🌈", "rate": 2.857 },
                { "rarity": "☆☆☆", "rate": 0.888 },
                { "rarity": "☆☆", "rate": 2 },
                { "rarity": "☆", "rate": 10.288 },
                { "rarity": "♢♢♢♢", "rate": 6.664 },
                { "rarity": "♢♢♢", "rate": 19.81 },
                { "rarity": "♢♢", "rate": 56 }
            ],
            "rarityTable6Pack6th": [
                { "rarity": "🌈🌈", "rate": 31.82 },
                { "rarity": "🌈", "rate": 68.18 },
                { "rarity": "☆", "rate": 0 },
                { "rarity": "♢♢♢", "rate": 0 }
            ],
            "rarityTableGodPack": [
                { "rarity": "👑", "rate": 10 },
                { "rarity": "🌈🌈", "rate": 0 },
                { "rarity": "🌈", "rate": 0 },
                { "rarity": "☆☆☆", "rate": 5 },
                { "rarity": "☆☆", "rate": 55 },
                { "rarity": "☆", "rate": 30 }
            ],
            "rarityCounts": { "👑": 2, "🌈🌈": 4, "🌈": 10, "☆☆☆": 1, "☆☆": 11, "☆": 6, "♢♢♢♢": 5, "♢♢♢": 8, "♢♢": 24, "♢": 32 },
            "rarityDesired": { "👑": [], "🌈🌈": [], "🌈": [], "☆☆☆": [], "☆☆": [7], "☆": [], "♢♢♢♢": [], "♢♢♢": [], "♢♢": [], "♢": [] }
        },
        "夢幻パレード": {
            "sixCardProb": 5.238,
            "sixCardProbInput": 5.238,
            "godPackProb": 0.05,
            "godPackProbInput": 0.05,
            "rarityTable4th": [
                { "rarity": "👑", "rate": 0.04 },
                { "rarity": "🌈🌈", "rate": 0 },
                { "rarity": "🌈", "rate": 0 },
                { "rarity": "☆☆☆", "rate": 0.222 },
                { "rarity": "☆☆", "rate": 0.5 },
                { "rarity": "☆", "rate": 2.572 },
                { "rarity": "♢♢♢♢", "rate": 1.667 },
                { "rarity": "♢♢♢", "rate": 5 },
                { "rarity": "♢♢", "rate": 89.999 }
            ],
            "rarityTable5th": [
                { "rarity": "👑", "rate": 0.16 },
                { "rarity": "🌈🌈", "rate": 0 },
                { "rarity": "🌈", "rate": 0 },
                { "rarity": "☆☆☆", "rate": 0.889 },
                { "rarity": "☆☆", "rate": 2 },
                { "rarity": "☆", "rate": 10.286 },
                { "rarity": "♢♢♢♢", "rate": 6.667 },
                { "rarity": "♢♢♢", "rate": 20 },
                { "rarity": "♢♢", "rate": 59.998 }
            ],
            "rarityTable6Pack4th": [
                { "rarity": "👑", "rate": 0.04 },
                { "rarity": "🌈🌈", "rate": 0 },
                { "rarity": "🌈", "rate": 0 },
                { "rarity": "☆☆☆", "rate": 0.222 },
                { "rarity": "☆☆", "rate": 0.5 },
                { "rarity": "☆", "rate": 2.572 },
                { "rarity": "♢♢♢♢", "rate": 1.667 },
                { "rarity": "♢♢♢", "rate": 5 },
                { "rarity": "♢♢", "rate": 89.999 }
            ],
            "rarityTable6Pack5th": [
                { "rarity": "👑", "rate": 0.16 },
                { "rarity": "🌈🌈", "rate": 0 },
                { "rarity": "🌈", "rate": 0 },
                { "rarity": "☆☆☆", "rate": 0.889 },
                { "rarity": "☆☆", "rate": 2 },
                { "rarity": "☆", "rate": 10.286 },
                { "rarity": "♢♢♢♢", "rate": 6.667 },
                { "rarity": "♢♢♢", "rate": 20 },
                { "rarity": "♢♢", "rate": 59.998 }
            ],
            "rarityTable6Pack6th": [
                { "rarity": "🌈🌈", "rate": 31.82 },
                { "rarity": "🌈", "rate": 68.18 },
                { "rarity": "☆", "rate": 0 },
                { "rarity": "♢♢♢", "rate": 0 }
            ],
            "rarityTableGodPack": [
                { "rarity": "👑", "rate": 3.921 },
                { "rarity": "🌈🌈", "rate": 0 },
                { "rarity": "🌈", "rate": 0 },
                { "rarity": "☆☆☆", "rate": 3.921 },
                { "rarity": "☆☆", "rate": 45.098 },
                { "rarity": "☆", "rate": 47.058 }
            ],
            "rarityCounts": { "👑": 2, "🌈🌈": 8, "🌈": 20, "☆☆☆": 2, "☆☆": 23, "☆": 27, "♢♢♢♢": 10, "♢♢♢": 28, "♢♢": 51, "♢": 66 },
            "rarityDesired": { "👑": [], "🌈🌈": [], "🌈": [], "☆☆☆": [1], "☆☆": [6], "☆": [], "♢♢♢♢": [6], "♢♢♢": [], "♢♢": [], "♢": [] }
        }
    };

    function getPresets() {
        const stored = localStorage.getItem('pokePackPresets');
        const userPresets = stored ? JSON.parse(stored) : {};
        // Merge defaults with user presets (user presets override defaults if name matches)
        return { ...DEFAULT_PRESETS, ...userPresets };
    }

    function savePresetsToStorage(presets) {
        localStorage.setItem('pokePackPresets', JSON.stringify(presets));
    }

    // --- Persistence Logic ---
    function saveActiveSettings() {
        const settings = getCurrentSettingsObj();
        localStorage.setItem('pokePackActiveSettings', JSON.stringify(settings));
    }

    function loadActiveSettings() {
        const stored = localStorage.getItem('pokePackActiveSettings');
        if (stored) {
            try {
                const settings = JSON.parse(stored);
                // Apply the settings using the same logic as applyPreset
                if (settings.sixCardProb !== undefined) sixCardProb = settings.sixCardProb;
                if (settings.godPackProb !== undefined) godPackProb = settings.godPackProb; // Load God Pack prob
                if (settings.godPackMode !== undefined) godPackMode = settings.godPackMode; // Load God Pack mode

                if (settings.rarityTable4th) rarityTable4th = settings.rarityTable4th;
                if (settings.rarityTable5th) rarityTable5th = settings.rarityTable5th;
                if (settings.rarityTable6Pack4th) rarityTable6Pack4th = settings.rarityTable6Pack4th;
                if (settings.rarityTable6Pack5th) rarityTable6Pack5th = settings.rarityTable6Pack5th;
                if (settings.rarityTable6Pack6th) rarityTable6Pack6th = settings.rarityTable6Pack6th;
                if (settings.rarityTableGodPack) rarityTableGodPack = settings.rarityTableGodPack; // Load God Pack table

                if (settings.rarityCounts) rarityCounts = settings.rarityCounts;
                if (settings.rarityDesired) rarityDesired = settings.rarityDesired;

                // Sync the main prob input if it exists
                if (probInput) probInput.value = sixCardProb;
                if (godProbInput) godProbInput.value = godPackProb;
            } catch (e) {
                console.error('Failed to load active settings', e);
            }
        }
    }

    function getCurrentSettingsObj() {
        // Collect current input values
        updateTableFromInputs(rarityTable4th, 'r4');
        updateTableFromInputs(rarityTable5th, 'r5');
        updateTableFromInputs(rarityTable6Pack4th, 'r6_4');
        updateTableFromInputs(rarityTable6Pack5th, 'r6_5');
        updateTableFromInputs(rarityTable6Pack6th, 'r6_6');
        updateTableFromInputs(rarityTableGodPack, 'god');

        return {
            sixCardProb: sixCardProb,
            sixCardProbInput: parseFloat(probInput.value),
            godPackProb: godPackProb, // Save God Pack prob
            godPackProbInput: parseFloat(godProbInput.value),
            godPackMode: godPackMode, // Save God Pack mode
            rarityTable4th: rarityTable4th,
            rarityTable5th: rarityTable5th,
            rarityTable6Pack4th: rarityTable6Pack4th,
            rarityTable6Pack5th: rarityTable6Pack5th,
            rarityTable6Pack6th: rarityTable6Pack6th,
            rarityTableGodPack: rarityTableGodPack, // Save God Pack table
            rarityCounts: rarityCounts, // Add counts to preset
            rarityDesired: rarityDesired // Add desired to preset
        };
    }

    function applyPreset(preset) {
        if (!preset) return;

        // Update variables
        sixCardProb = preset.sixCardProbInput;
        // Check if preset has god pack prob, else default (for backward compatibility)
        godPackProb = preset.godPackProbInput !== undefined ? preset.godPackProbInput : (preset.godPackProb !== undefined ? preset.godPackProb : 0.05);
        // Load God Pack mode with backward compatibility
        godPackMode = preset.godPackMode !== undefined ? preset.godPackMode : 'no-rainbow';

        rarityTable4th = JSON.parse(JSON.stringify(preset.rarityTable4th));
        rarityTable5th = JSON.parse(JSON.stringify(preset.rarityTable5th));

        // Handle backward compatibility for old presets (fill 6-pack tables with default logic if missing)
        if (preset.rarityTable6Pack4th) {
            rarityTable6Pack4th = JSON.parse(JSON.stringify(preset.rarityTable6Pack4th));
            rarityTable6Pack5th = JSON.parse(JSON.stringify(preset.rarityTable6Pack5th));
            rarityTable6Pack6th = JSON.parse(JSON.stringify(preset.rarityTable6Pack6th));
        }

        // Handle God Pack table compatibility
        if (preset.rarityTableGodPack) {
            rarityTableGodPack = JSON.parse(JSON.stringify(preset.rarityTableGodPack));
        }

        if (preset.rarityCounts) {
            rarityCounts = JSON.parse(JSON.stringify(preset.rarityCounts));
        }

        if (preset.rarityDesired) {
            rarityDesired = JSON.parse(JSON.stringify(preset.rarityDesired));
        } else {
            // Reset to empty if preset doesn't have it
            Object.keys(rarityDesired).forEach(k => rarityDesired[k] = []);
        }


        // Update Inputs in Settings Screen
        probInput.value = sixCardProb;
        godProbInput.value = godPackProb;

        // Regenerate rarity settings UI
        openSettings(); // Re-use openSettings logic to rebuild DOM
        // Since openSettings shows the screen, we might just want to refresh the inputs if already open, 
        // but rebuilding is safer for structure.

        // Close modal
        presetModal.classList.add('hidden');
        alert('プリセットを読み込みました');
    }

    function renderPresets() {
        const presets = getPresets();
        presetList.innerHTML = '';

        if (Object.keys(presets).length === 0) {
            presetList.innerHTML = '<li style="padding:10px;text-align:center;color:#777;">プリセットがありません</li>';
            return;
        }

        Object.keys(presets).forEach(name => {
            const li = document.createElement('li');
            li.className = 'preset-item';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'preset-name';
            nameSpan.textContent = name;

            const btnGroup = document.createElement('div');
            btnGroup.className = 'preset-item-buttons';

            // Load
            const btnLoad = document.createElement('button');
            btnLoad.className = 'preset-btn-sm btn-load';
            btnLoad.textContent = '読込';
            btnLoad.onclick = () => applyPreset(presets[name]);

            // Overwrite
            const btnOverwrite = document.createElement('button');
            btnOverwrite.className = 'preset-btn-sm btn-overwrite';
            btnOverwrite.textContent = '上書';
            btnOverwrite.onclick = () => {
                if (window.confirm(`プリセット「${name}」を現在の設定で上書きしますか？`)) {
                    presets[name] = getCurrentSettingsObj();
                    savePresetsToStorage(presets);
                    alert('上書き保存しました');
                }
            };

            // Delete
            const btnDelete = document.createElement('button');
            btnDelete.className = 'preset-btn-sm btn-delete';
            btnDelete.textContent = '削除';
            btnDelete.onclick = (e) => {
                e.preventDefault(); // Prevent default button behavior
                if (window.confirm(`プリセット「${name}」を削除しますか？`)) {
                    delete presets[name];
                    savePresetsToStorage(presets);
                    renderPresets();
                }
            };

            btnGroup.appendChild(btnLoad);
            btnGroup.appendChild(btnOverwrite);
            btnGroup.appendChild(btnDelete);

            li.appendChild(nameSpan);
            li.appendChild(btnGroup);
            presetList.appendChild(li);
        });
    }

    // Event Listeners for Presets
    btnPresets.addEventListener('click', () => {
        // Ensure tables are synced with current inputs
        updateTableFromInputs(rarityTable4th, 'r4');
        updateTableFromInputs(rarityTable5th, 'r5');
        updateTableFromInputs(rarityTable6Pack4th, 'r6_4');
        updateTableFromInputs(rarityTable6Pack5th, 'r6_5');
        updateTableFromInputs(rarityTable6Pack6th, 'r6_6');

        renderPresets();
        presetModal.classList.remove('hidden');
    });

    btnClosePresets.addEventListener('click', () => {
        presetModal.classList.add('hidden');
    });

    btnSaveNewPreset.addEventListener('click', () => {
        const name = newPresetName.value.trim();
        if (!name) {
            alert('プリセット名を入力してください');
            return;
        }

        const presets = getPresets();
        if (presets[name]) {
            if (!confirm(`同名のプリセット「${name}」が既に存在します。上書きしますか？`)) {
                return;
            }
        }

        presets[name] = getCurrentSettingsObj();
        savePresetsToStorage(presets);
        newPresetName.value = '';
        renderPresets();
    });

    // Event Listeners
    btnOpen1.addEventListener('click', () => openPack(1));
    btnOpen10.addEventListener('click', () => openPack(10));
    btnReopen.addEventListener('click', reopenPack);
    btnBackToHome.addEventListener('click', resetToHome);

    btnProb.addEventListener('click', openSettings);
    btnSaveSettings.addEventListener('click', saveSettings);
    btnCancelSettings.addEventListener('click', closeSettings);

    // Count Settings Events
    document.getElementById('btnCount').addEventListener('click', openCountSettings);
    btnSaveCountSettings.addEventListener('click', saveCountSettings);
    btnCancelCountSettings.addEventListener('click', closeCountSettings);

    // Auto-cap input at 100, and auto-fill 0 if empty
    probInput.addEventListener('input', () => {
        if (probInput.value === '') {
            probInput.value = 0;
        } else if (parseFloat(probInput.value) > 100) {
            probInput.value = 100;
        }
    });

    godProbInput.addEventListener('input', () => {
        if (godProbInput.value === '') {
            godProbInput.value = 0;
        } else if (parseFloat(godProbInput.value) > 100) {
            godProbInput.value = 100;
        }
    });

    // Allow Enter key to save
    probInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveSettings();
        }
    });

    // Load active settings on startup
    loadActiveSettings();
});
