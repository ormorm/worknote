(function ($) {
    "use strict";
    function getElementSelection(that) {
        var position = {};
        if (that.selectionStart === undefined) {
            that.focus();
            var select = document.selection.createRange();
            position.length = select.text.length;
            select.moveStart('character', -that.value.length);
            position.end = select.text.length;
            position.start = position.end - position.length
        } else {
            position.start = that.selectionStart;
            position.end = that.selectionEnd;
            position.length = position.end - position.start
        }
        return position
    }
    function setElementSelection(that, start, end) {
        if (that.selectionStart === undefined) {
            that.focus();
            var r = that.createTextRange();
            r.collapse(true);
            r.moveEnd('character', end);
            r.moveStart('character', start);
            r.select()
        } else {
            that.selectionStart = start;
            that.selectionEnd = end
        }
    }
    function runCallbacks($this, settings) {
        $.each(settings,
            function (k, val) {
                if (typeof val === 'function') {
                    settings[k] = val($this, settings, k)
                } else if (typeof $this.autoNumeric[val] === 'function') {
                    settings[k] = $this.autoNumeric[val]($this, settings, k)
                }
            })
    }
    function convertKeyToNumber(settings, key) {
        if (typeof (settings[key]) === 'string') {
            settings[key] *= 1
        }
    }
    function autoCode($this, settings) {
        runCallbacks($this, settings);
        settings.oEvent = null;
        settings.tagList = ['b', 'caption', 'cite', 'code', 'dd', 'del', 'div', 'dfn', 'dt', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ins', 'kdb', 'label', 'li', 'output', 'p', 'q', 's', 'sample', 'span', 'strong', 'td', 'th', 'u', 'var'];
        var vmax = settings.vMax.toString().split('.'),
            vmin = (!settings.vMin && settings.vMin !== 0) ? [] : settings.vMin.toString().split('.');
        convertKeyToNumber(settings, 'vMax');
        convertKeyToNumber(settings, 'vMin');
        convertKeyToNumber(settings, 'mDec');
        settings.mDec = (settings.mRound === 'CHF') ? '2' : settings.mDec;
        settings.allowLeading = true;
        settings.aNeg = settings.vMin < 0 ? '-' : '';
        vmax[0] = vmax[0].replace('-', '');
        vmin[0] = vmin[0].replace('-', '');
        settings.mInt = Math.max(vmax[0].length, vmin[0].length, 1);
        if (settings.mDec === null) {
            var vmaxLength = 0,
                vminLength = 0;
            if (vmax[1]) {
                vmaxLength = vmax[1].length
            }
            if (vmin[1]) {
                vminLength = vmin[1].length
            }
            settings.mDec = Math.max(vmaxLength, vminLength)
        }
        if (settings.altDec === null && settings.mDec > 0) {
            if (settings.aDec === '.' && settings.aSep !== ',') {
                settings.altDec = ','
            } else if (settings.aDec === ',' && settings.aSep !== '.') {
                settings.altDec = '.'
            }
        }
        var aNegReg = settings.aNeg ? '([-\\' + settings.aNeg + ']?)' : '(-?)';
        settings.aNegRegAutoStrip = aNegReg;
        settings.skipFirstAutoStrip = new RegExp(aNegReg + '[^-' + (settings.aNeg ? '\\' + settings.aNeg : '') + '\\' + settings.aDec + '\\d].*?(\\d|\\' + settings.aDec + '\\d)');
        settings.skipLastAutoStrip = new RegExp('(\\d\\' + settings.aDec + '?)[^\\' + settings.aDec + '\\d]\\D*$');
        var allowed = '-' + settings.aNum + '\\' + settings.aDec;
        settings.allowedAutoStrip = new RegExp('[^' + allowed + ']', 'gi');
        settings.numRegAutoStrip = new RegExp(aNegReg + '(?:\\' + settings.aDec + '?(\\d+\\' + settings.aDec + '\\d+)|(\\d*(?:\\' + settings.aDec + '\\d*)?))');
        return settings
    }
    function autoStrip(s, settings, strip_zero) {
        if (settings.aSign) {
            while (s.indexOf(settings.aSign) > -1) {
                s = s.replace(settings.aSign, '')
            }
        }
        s = s.replace(settings.skipFirstAutoStrip, '$1$2');
        s = s.replace(settings.skipLastAutoStrip, '$1');
        s = s.replace(settings.allowedAutoStrip, '');
        if (settings.altDec) {
            s = s.replace(settings.altDec, settings.aDec)
        }
        var m = s.match(settings.numRegAutoStrip);
        s = m ? [m[1], m[2], m[3]].join('') : '';
        if ((settings.lZero === 'allow' || settings.lZero === 'keep') && strip_zero !== 'strip') {
            var parts = [],
                nSign = '';
            parts = s.split(settings.aDec);
            if (parts[0].indexOf('-') !== -1) {
                nSign = '-';
                parts[0] = parts[0].replace('-', '')
            }
            if (parts[0].length > settings.mInt && parts[0].charAt(0) === '0') {
                parts[0] = parts[0].slice(1)
            }
            s = nSign + parts.join(settings.aDec)
        }
        if ((strip_zero && settings.lZero === 'deny') || (strip_zero && settings.lZero === 'allow' && settings.allowLeading === false)) {
            var strip_reg = '^' + settings.aNegRegAutoStrip + '0*(\\d' + (strip_zero === 'leading' ? ')' : '|$)');
            strip_reg = new RegExp(strip_reg);
            s = s.replace(strip_reg, '$1$2')
        }
        return s
    }
    function negativeBracket(s, nBracket, oEvent) {
        nBracket = nBracket.split(',');
        if (oEvent === 'set' || oEvent === 'focusout') {
            s = s.replace('-', '');
            s = nBracket[0] + s + nBracket[1]
        } else if ((oEvent === 'get' || oEvent === 'focusin' || oEvent === 'pageLoad') && s.charAt(0) === nBracket[0]) {
            s = s.replace(nBracket[0], '-');
            s = s.replace(nBracket[1], '')
        }
        return s
    }
    function truncateDecimal(s, aDec, mDec) {
        if (aDec && mDec) {
            var parts = s.split(aDec);
            if (parts[1] && parts[1].length > mDec) {
                if (mDec > 0) {
                    parts[1] = parts[1].substring(0, mDec);
                    s = parts.join(aDec)
                } else {
                    s = parts[0]
                }
            }
        }
        return s
    }
    function fixNumber(s, aDec, aNeg) {
        if (aDec && aDec !== '.') {
            s = s.replace(aDec, '.')
        }
        if (aNeg && aNeg !== '-') {
            s = s.replace(aNeg, '-')
        }
        if (!s.match(/\d/)) {
            s += '0'
        }
        return s
    }
    function checkValue(value, settings) {
        if (value) {
            var checkSmall = +value;
            if (checkSmall < 0.000001 && checkSmall > -1) {
                value = +value;
                if (value < 0.000001 && value > 0) {
                    value = (value + 10).toString();
                    value = value.substring(1)
                }
                if (value < 0 && value > -1) {
                    value = (value - 10).toString();
                    value = '-' + value.substring(2)
                }
                value = value.toString()
            } else {
                var parts = value.split('.');
                if (parts[1] !== undefined) {
                    if (+ parts[1] === 0) {
                        value = parts[0]
                    } else {
                        parts[1] = parts[1].replace(/0*$/, '');
                        value = parts.join('.')
                    }
                }
            }
        }
        return (settings.lZero === 'keep') ? value : value.replace(/^0*(\d)/, '$1')
    }
    function presentNumber(s, aDec, aNeg) {
        if (aNeg && aNeg !== '-') {
            s = s.replace('-', aNeg)
        }
        if (aDec && aDec !== '.') {
            s = s.replace('.', aDec)
        }
        return s
    }
    function autoCheck(s, settings) {
        s = autoStrip(s, settings);
        s = truncateDecimal(s, settings.aDec, settings.mDec);
        s = fixNumber(s, settings.aDec, settings.aNeg);
        var value = +s;
        if (settings.oEvent === 'set' && (value < settings.vMin || value > settings.vMax)) {
            $.error("The value (" + value + ") from the 'set' method falls outside of the vMin / vMax range")
        }
        return value >= settings.vMin && value <= settings.vMax
    }
    function checkEmpty(iv, settings, signOnEmpty) {
        if (iv === '' || iv === settings.aNeg) {
            if (settings.wEmpty === 'zero') {
                return iv + '0'
            }
            if (settings.wEmpty === 'sign' || signOnEmpty) {
                return iv + settings.aSign
            }
            return iv
        }
        return null
    }
    function autoGroup(iv, settings) {
        iv = autoStrip(iv, settings);
        var testNeg = iv.replace(',', '.'),
            empty = checkEmpty(iv, settings, true);
        if (empty !== null) {
            return empty
        }
        var digitalGroup = '';
        if (settings.dGroup === 2) {
            digitalGroup = /(\d)((\d)(\d{2}?)+)$/
        } else if (settings.dGroup === 4) {
            digitalGroup = /(\d)((\d{4}?)+)$/
        } else {
            digitalGroup = /(\d)((\d{3}?)+)$/
        }
        var ivSplit = iv.split(settings.aDec);
        if (settings.altDec && ivSplit.length === 1) {
            ivSplit = iv.split(settings.altDec)
        }
        var s = ivSplit[0];
        if (settings.aSep) {
            while (digitalGroup.test(s)) {
                s = s.replace(digitalGroup, '$1' + settings.aSep + '$2')
            }
        }
        if (settings.mDec !== 0 && ivSplit.length > 1) {
            if (ivSplit[1].length > settings.mDec) {
                ivSplit[1] = ivSplit[1].substring(0, settings.mDec)
            }
            iv = s + settings.aDec + ivSplit[1]
        } else {
            iv = s
        }
        if (settings.aSign) {
            var has_aNeg = iv.indexOf(settings.aNeg) !== -1;
            iv = iv.replace(settings.aNeg, '');
            iv = settings.pSign === 'p' ? settings.aSign + iv : iv + settings.aSign;
            if (has_aNeg) {
                iv = settings.aNeg + iv
            }
        }
        if (settings.oEvent === 'set' && testNeg < 0 && settings.nBracket !== null) {
            iv = negativeBracket(iv, settings.nBracket, settings.oEvent)
        }
        return iv
    }
    function autoRound(iv, settings) {
        iv = (iv === '') ? '0' : iv.toString();
        convertKeyToNumber(settings, 'mDec');
        if (settings.mRound === 'CHF') {
            iv = (Math.round(iv * 20) / 20).toString()
        }
        var ivRounded = '',
            i = 0,
            nSign = '',
            rDec = (typeof (settings.aPad) === 'boolean' || settings.aPad === null) ? (settings.aPad ? settings.mDec : 0) : +settings.aPad;
        var truncateZeros = function (ivRounded) {
            var regex = (rDec === 0) ? (/(\.(?:\d*[1-9])?)0*$/) : rDec === 1 ? (/(\.\d(?:\d*[1-9])?)0*$/) : new RegExp('(\\.\\d{' + rDec + '}(?:\\d*[1-9])?)0*$');
            ivRounded = ivRounded.replace(regex, '$1');
            if (rDec === 0) {
                ivRounded = ivRounded.replace(/\.$/, '')
            }
            return ivRounded
        };
        if (iv.charAt(0) === '-') {
            nSign = '-';
            iv = iv.replace('-', '')
        }
        if (!iv.match(/^\d/)) {
            iv = '0' + iv
        }
        if (nSign === '-' && +iv === 0) {
            nSign = ''
        }
        if ((+ iv > 0 && settings.lZero !== 'keep') || (iv.length > 0 && settings.lZero === 'allow')) {
            iv = iv.replace(/^0*(\d)/, '$1')
        }
        var dPos = iv.lastIndexOf('.'),
            vdPos = (dPos === -1) ? iv.length - 1 : dPos,
            cDec = (iv.length - 1) - vdPos;
        if (cDec <= settings.mDec) {
            ivRounded = iv;
            if (cDec < rDec) {
                if (dPos === -1) {
                    ivRounded += '.'
                }
                var zeros = '000000';
                while (cDec < rDec) {
                    zeros = zeros.substring(0, rDec - cDec);
                    ivRounded += zeros;
                    cDec += zeros.length
                }
            } else if (cDec > rDec) {
                ivRounded = truncateZeros(ivRounded)
            } else if (cDec === 0 && rDec === 0) {
                ivRounded = ivRounded.replace(/\.$/, '')
            }
            if (settings.mRound !== 'CHF') {
                return (+ ivRounded === 0) ? ivRounded : nSign + ivRounded
            }
            if (settings.mRound === 'CHF') {
                dPos = ivRounded.lastIndexOf('.');
                iv = ivRounded
            }
        }
        var rLength = dPos + settings.mDec,
            tRound = +iv.charAt(rLength + 1),
            ivArray = iv.substring(0, rLength + 1).split(''),
            odd = (iv.charAt(rLength) === '.') ? (iv.charAt(rLength - 1) % 2) : (iv.charAt(rLength) % 2),
            onePass = true;
        odd = (odd === 0 && (iv.substring(rLength + 2, iv.length) > 0)) ? 1 : 0;
        if ((tRound > 4 && settings.mRound === 'S') || (tRound > 4 && settings.mRound === 'A' && nSign === '') || (tRound > 5 && settings.mRound === 'A' && nSign === '-') || (tRound > 5 && settings.mRound === 's') || (tRound > 5 && settings.mRound === 'a' && nSign === '') || (tRound > 4 && settings.mRound === 'a' && nSign === '-') || (tRound > 5 && settings.mRound === 'B') || (tRound === 5 && settings.mRound === 'B' && odd === 1) || (tRound > 0 && settings.mRound === 'C' && nSign === '') || (tRound > 0 && settings.mRound === 'F' && nSign === '-') || (tRound > 0 && settings.mRound === 'U') || (settings.mRound === 'CHF')) {
            for (i = (ivArray.length - 1); i >= 0; i -= 1) {
                if (ivArray[i] !== '.') {
                    if (settings.mRound === 'CHF' && ivArray[i] <= 2 && onePass) {
                        ivArray[i] = 0;
                        onePass = false;
                        break
                    }
                    if (settings.mRound === 'CHF' && ivArray[i] <= 7 && onePass) {
                        ivArray[i] = 5;
                        onePass = false;
                        break
                    }
                    if (settings.mRound === 'CHF' && onePass) {
                        ivArray[i] = 10;
                        onePass = false
                    } else {
                        ivArray[i] = +ivArray[i] + 1
                    }
                    if (ivArray[i] < 10) {
                        break
                    }
                    if (i > 0) {
                        ivArray[i] = '0'
                    }
                }
            }
        }
        ivArray = ivArray.slice(0, rLength + 1);
        ivRounded = truncateZeros(ivArray.join(''));
        return (+ ivRounded === 0) ? ivRounded : nSign + ivRounded
    }
    function AutoNumericHolder(that, settings) {
        this.settings = settings;
        this.that = that;
        this.$that = $(that);
        this.formatted = false;
        this.settingsClone = autoCode(this.$that, this.settings);
        this.value = that.value
    }
    AutoNumericHolder.prototype = {
        init: function (e) {
            this.value = this.that.value;
            this.settingsClone = autoCode(this.$that, this.settings);
            this.ctrlKey = e.ctrlKey;
            this.cmdKey = e.metaKey;
            this.shiftKey = e.shiftKey;
            this.selection = getElementSelection(this.that);
            if (e.type === 'keydown' || e.type === 'keyup') {
                this.kdCode = e.keyCode
            }
            this.which = e.which;
            this.processed = false;
            this.formatted = false
        },
        setSelection: function (start, end, setReal) {
            start = Math.max(start, 0);
            end = Math.min(end, this.that.value.length);
            this.selection = {
                start: start,
                end: end,
                length: end - start
            };
            if (setReal === undefined || setReal) {
                setElementSelection(this.that, start, end)
            }
        },
        setPosition: function (pos, setReal) {
            this.setSelection(pos, pos, setReal)
        },
        getBeforeAfter: function () {
            var value = this.value,
                left = value.substring(0, this.selection.start),
                right = value.substring(this.selection.end, value.length);
            return [left, right]
        },
        getBeforeAfterStriped: function () {
            var parts = this.getBeforeAfter();
            parts[0] = autoStrip(parts[0], this.settingsClone);
            parts[1] = autoStrip(parts[1], this.settingsClone);
            return parts
        },
        normalizeParts: function (left, right) {
            var settingsClone = this.settingsClone;
            right = autoStrip(right, settingsClone);
            var strip = right.match(/^\d/) ? true : 'leading';
            left = autoStrip(left, settingsClone, strip);
            if ((left === '' || left === settingsClone.aNeg) && settingsClone.lZero === 'deny') {
                if (right > '') {
                    right = right.replace(/^0*(\d)/, '$1')
                }
            }
            var new_value = left + right;
            if (settingsClone.aDec) {
                var m = new_value.match(new RegExp('^' + settingsClone.aNegRegAutoStrip + '\\' + settingsClone.aDec));
                if (m) {
                    left = left.replace(m[1], m[1] + '0');
                    new_value = left + right
                }
            }
            if (settingsClone.wEmpty === 'zero' && (new_value === settingsClone.aNeg || new_value === '')) {
                left += '0'
            }
            return [left, right]
        },
        setValueParts: function (left, right) {
            var settingsClone = this.settingsClone,
                parts = this.normalizeParts(left, right),
                new_value = parts.join(''),
                position = parts[0].length;
            if (autoCheck(new_value, settingsClone)) {
                new_value = truncateDecimal(new_value, settingsClone.aDec, settingsClone.mDec);
                if (position > new_value.length) {
                    position = new_value.length
                }
                this.value = new_value;
                this.setPosition(position, false);
                return true
            }
            return false
        },
        signPosition: function () {
            var settingsClone = this.settingsClone,
                aSign = settingsClone.aSign,
                that = this.that;
            if (aSign) {
                var aSignLen = aSign.length;
                if (settingsClone.pSign === 'p') {
                    var hasNeg = settingsClone.aNeg && that.value && that.value.charAt(0) === settingsClone.aNeg;
                    return hasNeg ? [1, aSignLen + 1] : [0, aSignLen]
                }
                var valueLen = that.value.length;
                return [valueLen - aSignLen, valueLen]
            }
            return [1000, -1]
        },
        expandSelectionOnSign: function (setReal) {
            var sign_position = this.signPosition(),
                selection = this.selection;
            if (selection.start < sign_position[1] && selection.end > sign_position[0]) {
                if ((selection.start < sign_position[0] || selection.end > sign_position[1]) && this.value.substring(Math.max(selection.start, sign_position[0]), Math.min(selection.end, sign_position[1])).match(/^\s*$/)) {
                    if (selection.start < sign_position[0]) {
                        this.setSelection(selection.start, sign_position[0], setReal)
                    } else {
                        this.setSelection(sign_position[1], selection.end, setReal)
                    }
                } else {
                    this.setSelection(Math.min(selection.start, sign_position[0]), Math.max(selection.end, sign_position[1]), setReal)
                }
            }
        },
        checkPaste: function () {
            if (this.valuePartsBeforePaste !== undefined) {
                var parts = this.getBeforeAfter(),
                    oldParts = this.valuePartsBeforePaste;
                delete this.valuePartsBeforePaste;
                parts[0] = parts[0].substr(0, oldParts[0].length) + autoStrip(parts[0].substr(oldParts[0].length), this.settingsClone);
                if (!this.setValueParts(parts[0], parts[1])) {
                    this.value = oldParts.join('');
                    this.setPosition(oldParts[0].length, false)
                }
            }
        },
        skipAllways: function (e) {
            var kdCode = this.kdCode,
                which = this.which,
                ctrlKey = this.ctrlKey,
                cmdKey = this.cmdKey,
                shiftKey = this.shiftKey;
            if (((ctrlKey || cmdKey) && e.type === 'keyup' && this.valuePartsBeforePaste !== undefined) || (shiftKey && kdCode === 45)) {
                this.checkPaste();
                return false
            }
            if ((kdCode >= 112 && kdCode <= 123) || (kdCode >= 91 && kdCode <= 93) || (kdCode >= 9 && kdCode <= 31) || (kdCode < 8 && (which === 0 || which === kdCode)) || kdCode === 144 || kdCode === 145 || kdCode === 45) {
                return true
            }
            if ((ctrlKey || cmdKey) && kdCode === 65) {
                return true
            }
            if ((ctrlKey || cmdKey) && (kdCode === 67 || kdCode === 86 || kdCode === 88)) {
                if (e.type === 'keydown') {
                    this.expandSelectionOnSign()
                }
                if (kdCode === 86 || kdCode === 45) {
                    if (e.type === 'keydown' || e.type === 'keypress') {
                        if (this.valuePartsBeforePaste === undefined) {
                            this.valuePartsBeforePaste = this.getBeforeAfter()
                        }
                    } else {
                        this.checkPaste()
                    }
                }
                return e.type === 'keydown' || e.type === 'keypress' || kdCode === 67
            }
            if (ctrlKey || cmdKey) {
                return true
            }
            if (kdCode === 37 || kdCode === 39) {
                var aSep = this.settingsClone.aSep,
                    start = this.selection.start,
                    value = this.that.value;
                if (e.type === 'keydown' && aSep && !this.shiftKey) {
                    if (kdCode === 37 && value.charAt(start - 2) === aSep) {
                        this.setPosition(start - 1)
                    } else if (kdCode === 39 && value.charAt(start + 1) === aSep) {
                        this.setPosition(start + 1)
                    }
                }
                return true
            }
            if (kdCode >= 34 && kdCode <= 40) {
                return true
            }
            return false
        },
        processAllways: function () {
            var parts;
            if (this.kdCode === 8 || this.kdCode === 46) {
                if (!this.selection.length) {
                    parts = this.getBeforeAfterStriped();
                    if (this.kdCode === 8) {
                        parts[0] = parts[0].substring(0, parts[0].length - 1)
                    } else {
                        parts[1] = parts[1].substring(1, parts[1].length)
                    }
                    this.setValueParts(parts[0], parts[1])
                } else {
                    this.expandSelectionOnSign(false);
                    parts = this.getBeforeAfterStriped();
                    this.setValueParts(parts[0], parts[1])
                }
                return true
            }
            return false
        },
        processKeypress: function () {
            var settingsClone = this.settingsClone,
                cCode = String.fromCharCode(this.which),
                parts = this.getBeforeAfterStriped(),
                left = parts[0],
                right = parts[1];
            if (cCode === settingsClone.aDec || (settingsClone.altDec && cCode === settingsClone.altDec) || ((cCode === '.' || cCode === ',') && this.kdCode === 110)) {
                if (!settingsClone.mDec || !settingsClone.aDec) {
                    return true
                }
                if (settingsClone.aNeg && right.indexOf(settingsClone.aNeg) > -1) {
                    return true
                }
                if (left.indexOf(settingsClone.aDec) > -1) {
                    return true
                }
                if (right.indexOf(settingsClone.aDec) > 0) {
                    return true
                }
                if (right.indexOf(settingsClone.aDec) === 0) {
                    right = right.substr(1)
                }
                this.setValueParts(left + settingsClone.aDec, right);
                return true
            }
            if (cCode === '-' || cCode === '+') {
                if (!settingsClone.aNeg) {
                    return true
                }
                if (left === '' && right.indexOf(settingsClone.aNeg) > -1) {
                    left = settingsClone.aNeg;
                    right = right.substring(1, right.length)
                }
                if (left.charAt(0) === settingsClone.aNeg) {
                    left = left.substring(1, left.length)
                } else {
                    left = (cCode === '-') ? settingsClone.aNeg + left : left
                }
                this.setValueParts(left, right);
                return true
            }
            if (cCode >= '0' && cCode <= '9') {
                if (settingsClone.aNeg && left === '' && right.indexOf(settingsClone.aNeg) > -1) {
                    left = settingsClone.aNeg;
                    right = right.substring(1, right.length)
                }
                if (settingsClone.vMax <= 0 && settingsClone.vMin < settingsClone.vMax && this.value.indexOf(settingsClone.aNeg) === -1 && cCode !== '0') {
                    left = settingsClone.aNeg + left
                }
                this.setValueParts(left + cCode, right);
                return true
            }
            return true
        },
        formatQuick: function () {
            var settingsClone = this.settingsClone,
                parts = this.getBeforeAfterStriped(),
                leftLength = this.value;
            if ((settingsClone.aSep === '' || (settingsClone.aSep !== '' && leftLength.indexOf(settingsClone.aSep) === -1)) && (settingsClone.aSign === '' || (settingsClone.aSign !== '' && leftLength.indexOf(settingsClone.aSign) === -1))) {
                var subParts = [],
                    nSign = '';
                subParts = leftLength.split(settingsClone.aDec);
                if (subParts[0].indexOf('-') > -1) {
                    nSign = '-';
                    subParts[0] = subParts[0].replace('-', '');
                    parts[0] = parts[0].replace('-', '')
                }
                if (subParts[0].length > settingsClone.mInt && parts[0].charAt(0) === '0') {
                    parts[0] = parts[0].slice(1)
                }
                parts[0] = nSign + parts[0]
            }
            var value = autoGroup(this.value, this.settingsClone),
                position = value.length;
            if (value) {
                var left_ar = parts[0].split(''),
                    i = 0;
                for (i; i < left_ar.length; i += 1) {
                    if (!left_ar[i].match('\\d')) {
                        left_ar[i] = '\\' + left_ar[i]
                    }
                }
                var leftReg = new RegExp('^.*?' + left_ar.join('.*?'));
                var newLeft = value.match(leftReg);
                if (newLeft) {
                    position = newLeft[0].length;
                    if (((position === 0 && value.charAt(0) !== settingsClone.aNeg) || (position === 1 && value.charAt(0) === settingsClone.aNeg)) && settingsClone.aSign && settingsClone.pSign === 'p') {
                        position = this.settingsClone.aSign.length + (value.charAt(0) === '-' ? 1 : 0)
                    }
                } else if (settingsClone.aSign && settingsClone.pSign === 's') {
                    position -= settingsClone.aSign.length
                }
            }
            this.that.value = value;
            this.setPosition(position);
            this.formatted = true
        }
    };
    function autoGet(obj) {
        if (typeof obj === 'string') {
            obj = obj.replace(/\[/g, "\\[").replace(/\]/g, "\\]");
            obj = '#' + obj.replace(/(:|\.)/g, '\\$1')
        }
        return $(obj)
    }
    function getHolder($that, settings, update) {
        var data = $that.data('autoNumeric');
        if (!data) {
            data = {};
            $that.data('autoNumeric', data)
        }
        var holder = data.holder;
        if ((holder === undefined && settings) || update) {
            holder = new AutoNumericHolder($that.get(0), settings);
            data.holder = holder
        }
        return holder
    }
    var methods = {
        init: function (options) {
            return this.each(function () {
                var $this = $(this),
                    settings = $this.data('autoNumeric'),
                    tagData = $this.data();
                if (typeof settings !== 'object') {
                    var defaults = {
                        aNum: '0123456789',
                        aSep: ',',
                        dGroup: '3',
                        aDec: '.',
                        altDec: null,
                        aSign: '',
                        pSign: 'p',
                        vMax: '9999999999999.99',
                        vMin: '0.00',
                        mDec: null,
                        mRound: 'S',
                        aPad: true,
                        nBracket: null,
                        wEmpty: 'empty',
                        lZero: 'allow',
                        aForm: true,
                        onSomeEvent: function () { }
                    };
                    settings = $.extend({},
                        defaults, tagData, options);
                    if (settings.aDec === settings.aSep) {
                        $.error("autoNumeric will not function properly when the decimal character aDec: '" + settings.aDec + "' and thousand separator aSep: '" + settings.aSep + "' are the same character");
                        return this
                    }
                    $this.data('autoNumeric', settings)
                } else {
                    return this
                }
                settings.runOnce = false;
                var holder = getHolder($this, settings);
                if ($.inArray($this.prop('tagName').toLowerCase(), settings.tagList) === -1 && $this.prop('tagName').toLowerCase() !== 'input') {
                    $.error("The <" + $this.prop('tagName').toLowerCase() + "> is not supported by autoNumeric()");
                    return this
                }
                if (settings.runOnce === false && settings.aForm) {
                    if ($this.is('input[type=text], input[type=hidden], input[type=tel], input:not([type])')) {
                        var setValue = true;
                        if ($this[0].value === '' && settings.wEmpty === 'empty') {
                            $this[0].value = '';
                            setValue = false
                        }
                        if ($this[0].value === '' && settings.wEmpty === 'sign') {
                            $this[0].value = settings.aSign;
                            setValue = false
                        }
                        if (setValue) {
                            $this.autoNumeric('set', $this.val())
                        }
                    }
                    if ($.inArray($this.prop('tagName').toLowerCase(), settings.tagList) !== -1 && $this.text() !== '') {
                        $this.autoNumeric('set', $this.text())
                    }
                }
                settings.runOnce = true;
                if ($this.is('input[type=text], input[type=hidden], input[type=tel], input:not([type])')) {
                    $this.on('keydown.autoNumeric',
                        function (e) {
                            holder = getHolder($this);
                            if (holder.settings.aDec === holder.settings.aSep) {
                                $.error("autoNumeric will not function properly when the decimal character aDec: '" + holder.settings.aDec + "' and thousand separator aSep: '" + holder.settings.aSep + "' are the same character");
                                return this
                            }
                            if (holder.that.readOnly) {
                                holder.processed = true;
                                return true
                            }
                            holder.init(e);
                            holder.settings.oEvent = 'keydown';
                            if (holder.skipAllways(e)) {
                                holder.processed = true;
                                return true
                            }
                            if (holder.processAllways()) {
                                holder.processed = true;
                                holder.formatQuick();
                                e.preventDefault();
                                return false
                            }
                            holder.formatted = false;
                            return true
                        });
                    $this.on('keypress.autoNumeric',
                        function (e) {
                            var holder = getHolder($this),
                                processed = holder.processed;
                            holder.init(e);
                            holder.settings.oEvent = 'keypress';
                            if (holder.skipAllways(e)) {
                                return true
                            }
                            if (processed) {
                                e.preventDefault();
                                return false
                            }
                            if (holder.processAllways() || holder.processKeypress()) {
                                holder.formatQuick();
                                e.preventDefault();
                                return false
                            }
                            holder.formatted = false
                        });
                    $this.on('keyup.autoNumeric',
                        function (e) {
                            var holder = getHolder($this);
                            holder.init(e);
                            holder.settings.oEvent = 'keyup';
                            var skip = holder.skipAllways(e);
                            holder.kdCode = 0;
                            delete holder.valuePartsBeforePaste;
                            if ($this[0].value === holder.settings.aSign) {
                                if (holder.settings.pSign === 's') {
                                    setElementSelection(this, 0, 0)
                                } else {
                                    setElementSelection(this, holder.settings.aSign.length, holder.settings.aSign.length)
                                }
                            }
                            if (skip) {
                                return true
                            }
                            if (this.value === '') {
                                return true
                            }
                            if (!holder.formatted) {
                                holder.formatQuick()
                            }
                        });
                    $this.on('focusin.autoNumeric',
                        function () {
                            var holder = getHolder($this);
                            holder.settingsClone.oEvent = 'focusin';
                            if (holder.settingsClone.nBracket !== null) {
                                var checkVal = $this.val();
                                $this.val(negativeBracket(checkVal, holder.settingsClone.nBracket, holder.settingsClone.oEvent))
                            }
                            holder.inVal = $this.val();
                            var onempty = checkEmpty(holder.inVal, holder.settingsClone, true);
                            if (onempty !== null) {
                                $this.val(onempty);
                                if (holder.settings.pSign === 's') {
                                    setElementSelection(this, 0, 0)
                                } else {
                                    setElementSelection(this, holder.settings.aSign.length, holder.settings.aSign.length)
                                }
                            }
                        });
                    $this.on('focusout.autoNumeric',
                        function () {
                            var holder = getHolder($this),
                                settingsClone = holder.settingsClone,
                                value = $this.val(),
                                origValue = value;
                            holder.settingsClone.oEvent = 'focusout';
                            var strip_zero = '';
                            if (settingsClone.lZero === 'allow') {
                                settingsClone.allowLeading = false;
                                strip_zero = 'leading'
                            }
                            if (value !== '') {
                                value = autoStrip(value, settingsClone, strip_zero);
                                if (checkEmpty(value, settingsClone) === null && autoCheck(value, settingsClone, $this[0])) {
                                    value = fixNumber(value, settingsClone.aDec, settingsClone.aNeg);
                                    value = autoRound(value, settingsClone);
                                    value = presentNumber(value, settingsClone.aDec, settingsClone.aNeg)
                                } else {
                                    value = ''
                                }
                            }
                            var groupedValue = checkEmpty(value, settingsClone, false);
                            if (groupedValue === null) {
                                groupedValue = autoGroup(value, settingsClone)
                            }
                            if (groupedValue !== origValue) {
                                $this.val(groupedValue)
                            }
                            if (groupedValue !== holder.inVal) {
                                $this.change();
                                delete holder.inVal
                            }
                            if (settingsClone.nBracket !== null && $this.autoNumeric('get') < 0) {
                                holder.settingsClone.oEvent = 'focusout';
                                $this.val(negativeBracket($this.val(), settingsClone.nBracket, settingsClone.oEvent))
                            }
                        })
                }
            })
        },
        destroy: function () {
            return $(this).each(function () {
                var $this = $(this);
                $this.off('.autoNumeric');
                $this.removeData('autoNumeric')
            })
        },
        update: function (options) {
            return $(this).each(function () {
                var $this = autoGet($(this)),
                    settings = $this.data('autoNumeric');
                if (typeof settings !== 'object') {
                    $.error("You must initialize autoNumeric('init', {options}) prior to calling the 'update' method");
                    return this
                }
                var strip = $this.autoNumeric('get');
                settings = $.extend(settings, options);
                getHolder($this, settings, true);
                if (settings.aDec === settings.aSep) {
                    $.error("autoNumeric will not function properly when the decimal character aDec: '" + settings.aDec + "' and thousand separator aSep: '" + settings.aSep + "' are the same character");
                    return this
                }
                $this.data('autoNumeric', settings);
                if ($this.val() !== '' || $this.text() !== '') {
                    return $this.autoNumeric('set', strip)
                }
                return
            })
        },
        set: function (valueIn) {
            return $(this).each(function () {
                var $this = autoGet($(this)),
                    settings = $this.data('autoNumeric'),
                    value = valueIn.toString(),
                    testValue = valueIn.toString();
                if (typeof settings !== 'object') {
                    $.error("You must initialize autoNumeric('init', {options}) prior to calling the 'set' method");
                    return this
                }
                if (testValue !== $this.attr('value') && $this.prop('tagName').toLowerCase() === 'input' && settings.runOnce === false) {
                    value = (settings.nBracket !== null) ? negativeBracket($this.val(), settings.nBracket, 'pageLoad') : value;
                    value = autoStrip(value, settings)
                }
                if ((testValue === $this.attr('value') || testValue === $this.text()) && settings.runOnce === false) {
                    value = value.replace(',', '.')
                }
                if (!$.isNumeric(+ value)) {
                    return ''
                }
                value = checkValue(value, settings);
                settings.oEvent = 'set';
                value.toString();
                if (value !== '') {
                    value = autoRound(value, settings)
                }
                value = presentNumber(value, settings.aDec, settings.aNeg);
                if (!autoCheck(value, settings)) {
                    value = autoRound('', settings)
                }
                value = autoGroup(value, settings);
                if ($this.is('input[type=text], input[type=hidden], input[type=tel], input:not([type])')) {
                    return $this.val(value)
                }
                if ($.inArray($this.prop('tagName').toLowerCase(), settings.tagList) !== -1) {
                    return $this.text(value)
                }
                $.error("The <" + $this.prop('tagName').toLowerCase() + "> is not supported by autoNumeric()");
                return false
            })
        },
        get: function () {
            var $this = autoGet($(this)),
                settings = $this.data('autoNumeric');
            if (typeof settings !== 'object') {
                $.error("You must initialize autoNumeric('init', {options}) prior to calling the 'get' method");
                return this
            }
            settings.oEvent = 'get';
            var getValue = '';
            if ($this.is('input[type=text], input[type=hidden], input[type=tel], input:not([type])')) {
                getValue = $this.eq(0).val()
            } else if ($.inArray($this.prop('tagName').toLowerCase(), settings.tagList) !== -1) {
                getValue = $this.eq(0).text()
            } else {
                $.error("The <" + $this.prop('tagName').toLowerCase() + "> is not supported by autoNumeric()");
                return false
            }
            if ((getValue === '' && settings.wEmpty === 'empty') || (getValue === settings.aSign && (settings.wEmpty === 'sign' || settings.wEmpty === 'empty'))) {
                return ''
            }
            if (settings.nBracket !== null && getValue !== '') {
                getValue = negativeBracket(getValue, settings.nBracket, settings.oEvent)
            }
            if (settings.runOnce || settings.aForm === false) {
                getValue = autoStrip(getValue, settings)
            }
            getValue = fixNumber(getValue, settings.aDec, settings.aNeg);
            if (+ getValue === 0 && settings.lZero !== 'keep') {
                getValue = '0'
            }
            if (settings.lZero === 'keep') {
                return getValue
            }
            getValue = checkValue(getValue, settings);
            return getValue
        },
        getString: function () {
            var isAutoNumeric = false,
                $this = autoGet($(this)),
                str = $this.serialize(),
                parts = str.split('&'),
                i = 0;
            for (i; i < parts.length; i += 1) {
                var miniParts = parts[i].split('=');
                var settings = $('*[name="' + decodeURIComponent(miniParts[0]) + '"]').data('autoNumeric');
                if (typeof settings === 'object') {
                    if (miniParts[1] !== null && $('*[name="' + decodeURIComponent(miniParts[0]) + '"]').data('autoNumeric') !== undefined) {
                        miniParts[1] = $('input[name="' + decodeURIComponent(miniParts[0]) + '"]').autoNumeric('get');
                        parts[i] = miniParts.join('=');
                        isAutoNumeric = true
                    }
                }
            }
            if (isAutoNumeric === true) {
                return parts.join('&')
            }
            return str
        },
        getArray: function () {
            var isAutoNumeric = false,
                $this = autoGet($(this)),
                formFields = $this.serializeArray();
            $.each(formFields,
                function (i, field) {
                    var settings = $('*[name="' + decodeURIComponent(field.name) + '"]').data('autoNumeric');
                    if (typeof settings === 'object') {
                        if (field.value !== '' && $('*[name="' + decodeURIComponent(field.name) + '"]').data('autoNumeric') !== undefined) {
                            field.value = $('input[name="' + decodeURIComponent(field.name) + '"]').autoNumeric('get').toString()
                        }
                        isAutoNumeric = true
                    }
                });
            if (isAutoNumeric === true) {
                return formFields
            }
            $.error("You must initialize autoNumeric('init', {options}) prior to calling the 'getArray' method");
            return this
        },
        getSettings: function () {
            var $this = autoGet($(this));
            return $this.eq(0).data('autoNumeric')
        }
    };
    $.fn.autoNumeric = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1))
        }
        if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments)
        }
        $.error('Method "' + method + '" is not supported by autoNumeric()')
    }
} (jQuery));