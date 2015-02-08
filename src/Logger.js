    /**
     * Logger class
     *
     * @class Logger
     */
    var Logger = (function() {
        /**
         * constructor
         *
         * @class Logger
         * @constructor
         * @param {Object} debugOptions debug options
         */
        var Logger = function(debugOptions) {
            var log;
            // create log function
            if (debugOptions.log) {
                if (window.console && console.log) {
                    if (console.log.bind) {
                        log = console.log.bind(console);
                    } else {
                        log = function() {
                            var text = Array.prototype.join.apply(arguments, [""]);
                            console.log(text);
                        }
                    }
                } else if (debugOptions.alert) {
                    log = function() {
                        var text = Array.prototype.join.apply(arguments, [""]);
                        alert(text);
                    }
                } else {
                    log = function(){};
                }
            } else {
                log = function(){};
            }
            /**
             * log
             *
             * @method log
             * @param {Object} ...obj
             */
            Logger.prototype.log = log;
        }

        /**
         * debug the layout
         *
         * @method debugLayout
         * @param  {Object} context the context of canvas
         * @param  {Number} seriesLength the length of series
         * @param  {Object} layout the layout properties
         */
        Logger.prototype.debugLayout = function(context, seriesLength, layout) {
            context.save();
            context.strokeStyle = "gray";
            context.lineWidth = 1;
            context.strokeRect(0, 0, layout.canvasWidth, layout.canvasHeight);
            for (var i = 0; i < seriesLength; i++) {
                var c = col(layout.columns, i);
                var r = row(layout.columns, i);
                context.strokeRect(
                    layout.margin + layout.cellWidth * c + layout.hMargin * c,
                    layout.margin + layout.cellHeight * r + layout.vMargin * r,
                    layout.cellWidth,
                    layout.cellHeight);
            }
            context.restore();
        }

        /**
         * debug the cell layout
         *
         * @method debugCellLayout
         * @param  {Object} context the context of canvas
         * @param  {Object} gaugeOptions the option of the gauge
         * @param  {Object} layout the layout properties
         * @param  {Object} cellLayout the cell layout properties
         */
        Logger.prototype.debugCellLayout = function(context, gaugeOptions, layout, cellLayout) {
            context.save();
            context.strokeStyle = "gray";
            context.lineWidth = 1;
            // debug label layout
            if (gaugeOptions.label.show) {
                var labelMarginWidth = (cellLayout.cellWidth / 3) + (layout.labelMargin * 2);
                var labelMarginHeight = layout.labelFontSize + (layout.labelMargin * 2);
                var labelWidth = (cellLayout.cellWidth / 3);
                var labelHeight = layout.labelFontSize;
                context.strokeRect(
                    cellLayout.cx - (labelMarginWidth / 2),
                    cellLayout.y + cellLayout.cellMargin + cellLayout.offsetY,
                    labelMarginWidth,
                    labelMarginHeight);
                context.strokeRect(
                    cellLayout.cx - (labelWidth / 2),
                    cellLayout.y + cellLayout.cellMargin + layout.labelMargin + cellLayout.offsetY,
                    labelWidth,
                    labelHeight);
            }
            // debug value layout
            if (gaugeOptions.value.show) {
                var valueMarginWidth = (cellLayout.cellWidth / 3) + (layout.valueMargin * 2);
                var valueMarginHeight = layout.valueFontSize + (layout.valueMargin * 2);
                var valueWidth = (cellLayout.cellWidth / 3);
                var valueHeight = layout.valueFontSize;
                context.strokeRect(
                    cellLayout.cx - (valueMarginWidth / 2),
                    cellLayout.cy - (valueMarginHeight / 2),
                    valueMarginWidth,
                    valueMarginHeight);
                context.strokeRect(
                    cellLayout.cx - (valueWidth / 2),
                    cellLayout.cy - (valueHeight / 2),
                    valueWidth,
                    valueHeight);
            }
            // debug gauge center
            context.strokeRect(cellLayout.cx, cellLayout.cy, 1, 1);
            // debug gauge outer height
            context.strokeRect(
                cellLayout.x + cellLayout.cellMargin,
                cellLayout.y + cellLayout.cellMargin + labelMarginHeight + cellLayout.offsetY,
                cellLayout.cellWidth - (cellLayout.cellMargin * 2),
                layout.gaugeOuterHeight);
            // debug gauge layout
            drawArc(
                context,
                cellLayout.cx,
                cellLayout.cy,
                layout.radius,
                layout.width,
                toRad(gaugeOptions.gauge.startAngle),
                toRad(gaugeOptions.gauge.endAngle),
                context.strokeStyle);
            // debug threshold layout
            if (gaugeOptions.threshold.show) {
                drawArc(
                    context,
                    cellLayout.cx, cellLayout.cy,
                    layout.radius + layout.thresholdWidth,
                    layout.thresholdWidth,
                    toRad(gaugeOptions.gauge.startAngle),
                    toRad(gaugeOptions.gauge.endAngle),
                    context.strokeStyle);
            }
            // debug threshold label layout
            if (gaugeOptions.threshold.label.show) {
                drawArc(
                    context,
                    cellLayout.cx,
                    cellLayout.cy,
                    layout.radius + layout.thresholdWidth + layout.thresholdLabelFontSize + (layout.thresholdLabelMargin * 2),
                    layout.thresholdLabelFontSize + (layout.thresholdLabelMargin * 2),
                    toRad(gaugeOptions.gauge.startAngle),
                    toRad(gaugeOptions.gauge.endAngle),
                    context.strokeStyle);
            }
            context.restore();
        }

        return Logger;
    })();