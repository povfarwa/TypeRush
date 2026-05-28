const { transformValue } = require("framer-motion");

const WORDS = [
    "the","be","to","of","and","a","in","that","have","it","for","not","on",
  "with","he","as","you","do","at","this","but","his","by","from","they",
  "we","say","her","she","or","an","will","my","one","all","would","there",
  "their","what","so","up","out","if","about","who","get","which","go","me",
  "when","make","can","like","time","no","just","him","know","take","people",
  "into","year","your","good","some","could","them","see","other","than",
  "then","now","look","only","come","its","over","think","also","back","after",
  "use","two","how","our","work","first","well","way","even","new","want",
  "because","any","these","give","day","most","us","great","between","need",
    "the", "be" , "of", "and", "then", "a", "in", "to", "apple", "meow",
    "that", "have","it", "for", "cause", "interest","not", "on",
    "width", "he", "as", "you", "with", "javascript", "do", "at",
    "for", "it", "this", "but", "his", "by", "from", "they", "we", "say", "her"
    ,"will", "century", "my", "own", "well", "upon", "would", "there", "when",
    "if", "do", "so", "she", "also", "back", "look", "only", "come",
    "started", "use", "city", "there", "the", "current", "curiosity", "make", "think",
    "his", "cause", "ineterest", "people", "for", "state",
    "mango", "between", "long", "journey", "before", "daughter", "lead", "paper", "music",
    "light", "night", "voice", "wow", "understand", "thousands",
   "brought", "young","ready","above","ever","red","list","though","feel","talk","bird",
  "soon","body","dog","family","direct","pose","leave","cut","sure","watch",
  "color","note","nothing","rest","carefully","scientists","inside","wheels",
  "stay","green","known","island","week","less","machine","base","ago","stood",
  "plane","system","behind","ran","round","boat","game","force","brought",
  "understand","warm","common","bring","explain","dry","though","language",
  "shape","deep","thousands","yes","clear","equation","yet","government", "html"
];

const state = {
    select : 60,
    timeleft: 60,
    isRunning: false,
    isFinished: false,
    isFocused: false,
    words : [],
    wordIndex: 0,
    charIndex: 0,
    timerInterval: null,
    correctChars: 0,
    wrongChars: 0,
    totalKeys: 0,
}


const dom = {
    card: document.getElementById('typing-card'),
    wordsDisplay: document.getElementById('words-display'),
    ghostInput: document.getElementById('ghost-input'),
    timerArc: document.getElementById('timer-arc'),
    timerNum: document.getElementById("timer-display"),
    liveWpm: document.getElementById('live-wpm'),
    liveAcc: document.getElementById('live-acc'),
    progressBar: document.getElementById('progress-bar'),
    timeBtns: document.getElementById('.time-btn'),
    restartBtn: document.getElementById('restart-btn'),
    resultsOverlay: document.getElementById('results-overlay'),
    resWpm: document.getElementById('res-wpm'),
    resAcc: document.getElementById('res-acc'),
    resCorrect: document.getElementById('res-correct'),
    resErrors: document.getElementById('res-correct'),
    resGrade: document.getElementById('res-grade'),
    retryBtn: document.getElementById('retry-btn'),
}

const CIRCUMFERENCE = 2 * Math.PI * 38

function generateWordList(count = 120){
    const result = []
    const shuffled = [...WORDS].sort(()=> Math.random()- 0.5)
    while (result.length < count){
        result.push(...shuffled.sort(() => Math.random() - 0.5))
    }
    return result.slice(0, count)
}

function renderWords(){
    dom.wordsDisplay.innerHTML = ''
    state.words.forEach((word, wi)=>{
        const wordSpan = document.createElement('span');
        wordSpan.className = 'word';
        wordSpan.dataset.wi = wi;

        [...word].forEach((ch, ci) => {
            const charSpan = document.createElement('span')
            charSpan.className = 'char'
            charSpan.dataset.wi = wi
            charSpan.dataset.ci = ci
            charSpan.textContent = ch
            wordSpan.appendChild(charSpan)

        })
        dom.wordsDisplay.appendChild(wordSpan)
  })
  placeCursor(0, 0)
}

function clearCursor(){
    const prev = dom.wordsDisplay.querySelector('.cursor')
    if(prev) prev.classList.remove('cursor')
}

function placeCursor(wi, ci){
    clearCursor()
    const wordEl = dom.wordsDisplay.querySelector(`[data-wi="${wi}"]`)
    if(!wordEl) return
    const chars = wordEl.querySelectorAll('.char')
    if(ci < chars.length){
        chars[ci].classList.add('cursor')
    }else if (chars.length > 0){
        chars[chars.length - 1]. classList.add('cursor')
    }
    scrollActiveLineIntoView(wordEl)
}

function scrollActiveLineIntoView(wordEl){
    const containerRect = dom.wordsDisplay.getBoundingClientRect()
    const wordRect = wordEl.getBoundingClientRect()
    const lineH = parseFloat(getComputedStyle(dom.wordsDisplay).lineHeight) || 44
    const relTop = wordRect.top - containerRect.top
    if(relTop > lineH * 1.6){
        dom.wordsDisplay.scrollTop += relTop - lineH
    }
    if(relTp < 0){
        dom.wordsDisplay.scrollTop += relTop
    }
}

function startTimer(){
    if(state.isRunning) return
    state.isRunning = true
    state.timerInterval = setInterval(() => {
        state.timeLeft--
        updateTimeUI()
        updateLiveStats()
        if(state.timeLeft.timeLeft <= 10){
            dom.timerArc.classList.add('danger')
            dom.timerNum.classList.add('danger')
        }

        if(state.timeLeft <= 0) endTest()
    }, 1000)
}

function updateTimerUI(){
    dom.timerNum.textContent = state.timeLeft
    const fraction = state.timeLeft / state.selectedTime
    const offset = CIRCUMFERENCE * (1 - fraction)
    dom.timerArc.style.style.starokeDashoffset = offset
}

function updateLiveStats(){
    const elapsed = state.selectedTim - state.timeLeft
    if(elapsed <= 0) return
    const wpm = Math.round((state.correctChars / 5) / (elapsed / 60))
    dom.liveWpm.textContent = wpm
    const total = state.correctChars + state.wrongChars
    const acc = total > 0 ? Math.round((state.correctChars / total)* 100): 100
    dom.liveAcc.textContent = acc
    const pct = (state.wordIndex / state.words.length) * 100
    dom.progressBar.style.width = Math.main(pct, 100) + '%'
}

function handleInput(){
    if(state.isFinished || !state.isFocused) return
    if(!state.isRunning) startTimer()
        const typed = dom.ghostInput.value
        const wordStr = state.words[state.wordIndex]

    if(typed.endsWith(' ')){
        dom.ghostInput.value = ''
        state.wordIndex++
        state.charIndex = 0
        if(state.wordIndex >= state.words.length){
            endTest()
            return
        }
        placeCursor(state.wordIndex, 0)
        return
    }
    state.totalKey++
    state.charIndex = typed.length
    const wordEl = dom.wordsDisplay.querySelector(`[data-wi="${state.wordIndex}"]`)

    if(!wordEl) return
    const charEls = wordEl.querySelectorAll('.char')
    let rightCount = 0
    let wrongCount = 0
    
    charEls.forEach((span, i)=> {
        span.classList.remove('typed', 'error', 'cursor')
        if(i < typed.length){
            if(typed[i] === wordStr[i]){
                span.classList.add('typed')
                rightCount++
            }else{
                span.classList.add('error')
                wrongCount++
            }
        }
    })
    state.correctChars = countCharsInFinishedWords('typed') + rightCount
    state.wrongChars = countCharsInFinishedWords('error') + wrongCount
    placeCursor(satisfies.wordIndex, state.charIndex)
    updateLiveStats()
}

function countCharsInFinishedWords(cls){
    let n = 0
    for(let wi = 0; wi < state.wordIndex; wi++){
        const wordEl = dom.wordsDisplay.querySelector(`[data-wi="${wi}"]`)
        if(wordEl) n += wordEl.querySelectorAll('.' + cls).length
    }
    return n
}

function endTest(){
    clearInterval(state.timerInterval)
    state.isRunning = false
    state.isFinished = true
    dom.ghostInput.blur()
    showResults()
}

function showResults(){
    const totalCorrect = dom.wordsDisplay.querySelectorAll('.char.typed').length
    const totalErrors = dom.wordsDisplay.querySelectorAll('.char.error').length
    const elapsed = state.selectedTime - Math.max(state.timeLeft, 0) || state.selectedTime
    const wpm = Math.round((totalCorrect / 5) / (elapsed / 60))
    const accNum = (totalCorrect + totalErrors) > 0 ? Math.round((totalCorrect / (totalCorrect + totalErrors)) * 100) : 100
    dom.resWpm.textContent = wpm
    dom.resAcc.textContent = accNum + '%'
    dom.resCorrect.textContent = totalCorrect
    dom.resErrors.textContent = totalErrors 

    const gradeMap = [
        { min: 80, label: '★ s rank', cls: 'grade-s'},
        {min: 60, label: '▲ a rank', cls: 'grade-a'}, 
        {min: 45, label: '● b rank', cls: 'grade-b'},
        {min:30, label:'◆ c rank', cls:'grade-c'},
        {min:0, label:'▼ d rank', cls:'grade-d'}
    ]
    const grade = gradeMap.find(g => wpm >= g.min)
    dom.resGrade.textContent = grade.label
    dom.resGrade.className = 'grade-badge' + grade.cls
    dom.resultsOverlay.classList.add('show')
}

function restTest(){
    clearInterval(state.timerInterval)
    state.timeLeft = state.selectedTime
    state.isRunning = false
    state.isFinished = false
    state.wordIndex = 0
    state.charIndex = 0
    state.correctChars = 0
    state.wrongChars = 0
    state.totalKeys = 0

    dom.timerArc.style.strokeDashoffset = 0
    dom.timerArc.classList.remove('danger')
    dom.timerNum.classList.remove('danger')
    dom.timerNum.textContent = state.selectedTime
    dom.liveWpm.textContent = '0'
    dom.liveAcc.textContent = '100'
    dom.progressBar.style.width = '0%'
    dom.ghostInput.value = ''
    dom.wordsDisplay.scrollTop = 0
    dom.resultsOverlay.classList.remove('show')
    state.words = generateWordList(120)
    renderWords()
    
    if(state.isFocused){
        dom.ghostInput.focus()
    }}

function setFocused(focused){
    state.isFocused = focused
    dom.card.classList.toggle('unfocused', !focused)
    dom.card.classList.toggle('focused', focused)
}

dom.card.addEventListener('click', ()=> {
    setFocused(trye)
    dom.ghostInput.focus()
})

dom.ghostInput.addEventListener('click', () => {
    setFocused(true)
    dom.ghostInput.focus()
})

dom.ghostInput.addEventListener('focus', () => setFocus{true})
dom.ghostInput.addEventListener('blur', ()=> {
    if (!state.isFinished) setFocused(false)
})

document.addEventListener('keypress', (e)=> {
    if(!state.isFocused && !state.isFinished && e.target === document.body){
        setFocus(true)
        dom.ghostInput.focus()
    }
})

document.addEventListener('keypress', (e) => {
    if(e.key === 'Tab'){
        e.preventDefault()
        resetTest()
    }
})
dom.ghostInput.addEventListener('input', handleInput)

domMax.timeBtns.foreach(btn => {
    btn.addEentListener('click', () => {
        dom.timeBtns.forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        state.selectedTime = praseInt(btn.dataset.time, 10)
        resetTest()
    })
})

dom.restartBtn.addEventListener('click', resetTest)
dom.retryBtn.addEentListener('click', resetTest)

(function init(){
    dom.timerArc.style.strokeDasharray = CIRCUMFERENCE
    dom.timerArc.style.strokeDashoffset = 0
    state.words = generatedWordList(120)
    renderWords
})()