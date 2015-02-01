/**
 * Flot plugin for rendering gauge charts.
 *
 * Copyright (c) 2015 @toyoty99.
 *
 * Licensed under the MIT license.
 */

(function($) {

    function init (plot) {

        /** log function for debug */
        var log;

        // add processOptions hook
        plot.hooks.processOptions.push(function(plot, options) {
            // create log function
            if (options.series.gauges.debug.log) {
                if (window.console && console.log) {
                    if (console.log.bind) {
                        log = console.log.bind(console);
                    } else {
                        log = function() {
                            var text = Array.prototype.join.apply(arguments, [""]);
                            console.log(text);
                        }
                    }
                } else if (options.series.gauges.debug.alert) {
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

            log("flot.gauges.processOptions");
            log("options=", options);

            // turn 'grid' and 'legend' off
            if (options.series.gauges.show) {
                options.grid.show = false;
                options.legend.show = false;
            }

            // sort threshold
            var thresholds = options.series.gauges.threshold.values;
            log("thresholds=", thresholds);
            thresholds.sort(function(a, b) {
                if (a.value < b.value) {
                    return -1;
                } else if (a.value > b.value) {
                    return 1;
                } else {
                    return 0;
                }
            });
            log("thresholds(sorted)=", thresholds);

            log("options=", options);
        });

        // add draw hook
        plot.hooks.draw.push(function(plot, context) {
            var options = plot.getOptions();
            if (options.series.gauges.show) {
                draw(plot, context);
            }
        });

        /**
         * draw gauges
         *
         * @param  object plot    Flot object
         * @param  object context context of canvas
         */
        function draw (plot, context) {
            log("flot.gauges.draw");

            var canvas = plot.getCanvas();
            var placeholder = plot.getPlaceholder();
            var options = plot.getOptions();
            var gaugeOptions = options.series.gauges;

            if (!gaugeOptions.show) {
                return;
            }

            var series = plot.getData();
            log("series=", series);
            if (!series || !series.length) {
                return; // if no series were passed
            }


            // calculate layout
            var layout = calculateLayout(placeholder, gaugeOptions, series.length);
            log("layout=", layout);
            // debug layout
            if (gaugeOptions.debug.layout) {
                debugLayout(context, series.length, layout);
            }

            // draw background
            drawBackground(context, options, layout)

            // draw cells (label, gauge, value, threshold)
            for (var i = 0; i < series.length; i++) {
                var item = series[i];
                log("item[" + i + "]=", item);
                var gaugeOptionsi = $.extend({}, gaugeOptions, item.gauges);
                if (item.gauges) {
                    // re-calculate 'auto' values
                    calculateAutoValues(gaugeOptionsi, layout.cellWidth);
                }
                log("gaugeOptions[" + i + "]=", gaugeOptionsi);
                // calculate cell layout
                var cellLayout = calculateCellLayout(gaugeOptionsi, layout, i);
                log("cellLayout=", cellLayout);
                // draw cell background
                drawCellBackground(context, gaugeOptionsi, cellLayout)
                // debug layout
                if (gaugeOptionsi.debug.layout) {
                    debugCellLayout(context, gaugeOptionsi, layout, cellLayout);
                }
                // draw label
                if (gaugeOptionsi.label.show) {
                    drawLable(placeholder, gaugeOptionsi, layout, cellLayout, i, item);
                }
                // draw gauge
                drawGauge(context, gaugeOptionsi, layout, cellLayout, item.label, item.data[0][1]);
                // draw threshold
                if (gaugeOptionsi.threshold.show) {
                    drawThreshold(context, gaugeOptionsi, layout, cellLayout);
                }
                if (gaugeOptionsi.threshold.label.show) {
                    drawThresholdValues(placeholder, gaugeOptionsi, layout, cellLayout, i)
                }
                // draw value
                if (gaugeOptionsi.value.show) {
                    drawValue(placeholder, gaugeOptionsi, layout, cellLayout, i, item);
                }
            }
        }

        /**
         * calculate the index of columns for the specified data
         *
         * @param  number columns the number of columns
         * @param  number i       the index of the series
         * @return the index of columns
         */
        function col(columns, i) {
            return i % columns;
        }

        /**
         * calculate the index of rows for the specified data
         *
         * @param  number columns the number of rows
         * @param  number i       the index of the series
         * @return the index of rows
         */
        function row(columns, i) {
            return Math.floor(i / columns);
        }

        /**
         * calculate the angle in radians
         *
         * internally, use a number without PI (0 - 2).
         * so, in this function, multiply PI
         *
         * @param  number a the number of angle without PI
         * @return the angle in radians
         */
        function toRad(a) {
            return a * Math.PI;
        }

        /**
         * calculate layout
         *
         * @param  object placeholder  [description]
         * @param  object gaugeOptions the option of the gauge
         * @param  number seriesLength the length of series
         * @return the calculated layout properties
         */
        function calculateLayout(placeholder, gaugeOptions, seriesLength) {
            log("flot.gauges.calculateLayout");
            var canvasWidth = placeholder.width();
            var canvasHeight = placeholder.height();
            log("canvasWidth=", canvasWidth);
            log("canvasHeight=", canvasHeight);

            // calculate cell size
            var columns = Math.min(seriesLength, gaugeOptions.layout.columns);
            var rows = Math.ceil(seriesLength / columns);
            log("columns=", columns);
            log("rows=", rows);

            var margin = gaugeOptions.layout.margin;
            var hMargin = gaugeOptions.layout.hMargin;
            var vMargin = gaugeOptions.layout.vMargin;
            var cellWidth = (canvasWidth - (margin * 2) - (hMargin * (columns - 1))) / columns;
            var cellHeight = (canvasHeight - (margin * 2) - (vMargin * (rows - 1))) / rows;
            if (gaugeOptions.layout.square) {
                var cell = Math.min(cellWidth, cellHeight);
                cellWidth = cell;
                cellHeight = cell;
            }
            log("cellWidth=", cellWidth);
            log("cellHeight=", cellHeight);

            // calculate 'auto' values
            calculateAutoValues(gaugeOptions, cellWidth);

            // calculate maximum radius
            var cellMargin = gaugeOptions.cell.margin;
            var labelMargin = 0;
            var labelFontSize = 0;
            if (gaugeOptions.label.show) {
                labelMargin = gaugeOptions.label.margin;
                labelFontSize = gaugeOptions.label.font.size;
            }
            var valueMargin = 0;
            var valueFontSize = 0;
            if (gaugeOptions.value.show) {
                valueMargin = gaugeOptions.value.margin;
                valueFontSize = gaugeOptions.value.font.size;
            }
            var thresholdWidth = 0;
            if (gaugeOptions.threshold.show) {
                thresholdWidth = gaugeOptions.threshold.width;
            }
            var thresholdLabelMargin = 0;
            var thresholdLabelFontSize = 0;
            if (gaugeOptions.threshold.label.show) {
                thresholdLabelMargin = gaugeOptions.threshold.label.margin;
                thresholdLabelFontSize = gaugeOptions.threshold.label.font.size;
            }

            var maxRadiusH = (cellWidth / 2) - cellMargin - thresholdWidth - (thresholdLabelMargin * 2) - thresholdLabelFontSize;

            var startAngle = gaugeOptions.gauge.startAngle;
            var endAngle = gaugeOptions.gauge.endAngle;
            var dAngle = (endAngle - startAngle) / 100;
            var heightRatioV = -1;
            for (var a = startAngle; a < endAngle; a += dAngle) {
                heightRatioV = Math.max(heightRatioV, Math.sin(toRad(a)));
            }
            heightRatioV = Math.max(heightRatioV, Math.sin(toRad(endAngle)));
            var outerRadiusV = (cellHeight - (cellMargin * 2) - (labelMargin * 2) - labelFontSize) / (1 + heightRatioV);
            if (outerRadiusV * heightRatioV < valueMargin + (valueFontSize / 2)) {
                outerRadiusV = cellHeight - (cellMargin * 2) - (labelMargin * 2) - labelFontSize - valueMargin - (valueFontSize / 2);
            }
            var maxRadiusV = outerRadiusV - (thresholdLabelMargin * 2) - thresholdLabelFontSize - thresholdWidth;

            var radius = Math.min(maxRadiusH, maxRadiusV);
            log("radius=", radius);

            var width = gaugeOptions.gauge.width;
            if (width >= radius) {
                width = Math.max(3, radius / 3);
            }
            log("width=", width);

            var outerRadius = (thresholdLabelMargin * 2) + thresholdLabelFontSize + thresholdWidth + radius;
            var gaugeOuterHeight = Math.max(outerRadius * (1 + heightRatioV), outerRadius + valueMargin + (valueFontSize / 2));

            return {
                canvasWidth: canvasWidth,
                canvasHeight: canvasHeight,
                margin: margin,
                hMargin: hMargin,
                vMargin: vMargin,
                columns: columns,
                rows: rows,
                cellWidth: cellWidth,
                cellHeight: cellHeight,
                cellMargin: cellMargin,
                labelMargin: labelMargin,
                labelFontSize: labelFontSize,
                valueMargin: valueMargin,
                valueFontSize: valueFontSize,
                width: width,
                radius: radius,
                thresholdWidth: thresholdWidth,
                thresholdLabelMargin: thresholdLabelMargin,
                thresholdLabelFontSize: thresholdLabelFontSize,
                gaugeOuterHeight: gaugeOuterHeight
            };
        }

        /**
         * calculate the values which are set as 'auto'
         *
         * @param  object gaugeOptions the option of the gauge
         * @param  number cellWidth the width of cell
         */
        function calculateAutoValues(gaugeOptions, cellWidth) {
            log("flot.gauges.calculateAutoValues");
            if (gaugeOptions.gauge.width == "auto") {
                gaugeOptions.gauge.width = Math.max(5, cellWidth / 8);
            }
            if (gaugeOptions.label.margin == "auto") {
                gaugeOptions.label.margin = Math.max(1, cellWidth / 20);
            }
            if (gaugeOptions.label.font.size == "auto") {
                gaugeOptions.label.font.size = Math.max(5, cellWidth / 8);
            }
            if (gaugeOptions.value.margin == "auto") {
                gaugeOptions.value.margin = Math.max(1, cellWidth / 30);
            }
            if (gaugeOptions.value.font.size == "auto") {
                gaugeOptions.value.font.size = Math.max(5, cellWidth / 9);
            }
            if (gaugeOptions.threshold.width == "auto") {
                gaugeOptions.threshold.width = Math.max(3, cellWidth / 100);
            }
            if (gaugeOptions.threshold.label.margin == "auto") {
                gaugeOptions.threshold.label.margin = Math.max(3, cellWidth / 40);
            }
            if (gaugeOptions.threshold.label.font.size == "auto") {
                gaugeOptions.threshold.label.font.size = Math.max(5, cellWidth / 15);
            }
        }

        /**
         * debug the layout
         *
         * @param  object context the context of canvas
         * @param  number seriesLength the length of series
         * @param  object layout the layout properties
         */
        function debugLayout(context, seriesLength, layout) {
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
         * calculate the layout of the cell inside
         *
         * @param  object gaugeOptions the option of the gauge
         * @param  number cellWidth the width of cell
         * @param  number i the index of the series
         * @return the calculated cell layout properties
         */
        function calculateCellLayout(gaugeOptions, layout, i) {
            log("flot.gauges.calculateCellLayout");
            // calculate top, left and center
            var c = col(layout.columns, i);
            var r = row(layout.columns, i);
            var x = layout.margin + (layout.cellWidth + layout.hMargin) * c;
            var y = layout.margin + (layout.cellHeight + layout.vMargin) * r;
            var cx = x + (layout.cellWidth / 2);
            var cy = y + layout.cellMargin + (layout.labelMargin * 2) + layout.labelFontSize + layout.thresholdWidth
                        + layout.thresholdLabelFontSize + (layout.thresholdLabelMargin * 2) + layout.radius;
            var blank = layout.cellHeight - (layout.cellMargin * 2) - (layout.labelMargin * 2) - layout.labelFontSize - layout.gaugeOuterHeight;
            var offsetY = 0;
            if (gaugeOptions.cell.vAlign == "middle") {
                offsetY = (blank / 2);
            } else if (gaugeOptions.cell.vAlign == "bottom") {
                offsetY = blank;
            }
            cy += offsetY;

            return {
                col: c,
                row: r,
                x: x,
                y: y,
                offsetY: offsetY,
                cellWidth: layout.cellWidth,
                cellHeight: layout.cellHeight,
                cellMargin: layout.cellMargin,
                cx: cx,
                cy: cy
            }
        }

        /**
         * debug the cell layout
         *
         * @param  object context the context of canvas
         * @param  object gaugeOptions the option of the gauge
         * @param  object layout the layout properties
         * @param  object cellLayout the cell layout properties
         */
        function debugCellLayout(context, gaugeOptions, layout, cellLayout) {
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

        /**
         * draw the background of chart
         *
         * @param  object context the context of canvas
         * @param  object options the option of chart
         * @param  object layout the layout properties
         */
        function drawBackground(context, options, layout) {
            log("flot.gauges.drawBackground");
            context.save();
            context.strokeStyle = options.grid.borderColor;
            context.lineWidth = options.grid.borderWidth;
            context.strokeRect(0, 0, layout.canvasWidth, layout.canvasHeight);
            if (options.grid.backgroundColor) {
                context.fillStyle = options.grid.backgroundColor;
                context.fillRect(0, 0, layout.canvasWidth, layout.canvasHeight);
            }
            context.restore();
        }

        /**
         * draw the background of cell
         *
         * @param  object context the context of canvas
         * @param  object gaugeOptions the option of the gauge
         * @param  object cellLayout the cell layout properties
         */
        function drawCellBackground(context, gaugeOptions, cellLayout) {
            log("flot.gauges.drawCellBackground");
            context.save();
            if (gaugeOptions.cell.border && gaugeOptions.cell.border.color && gaugeOptions.cell.border.width) {
                context.strokeStyle = gaugeOptions.cell.border.color;
                context.lineWidth = gaugeOptions.cell.border.width;
                context.strokeRect(cellLayout.x, cellLayout.y, cellLayout.cellWidth, cellLayout.cellHeight);
            }
            if (gaugeOptions.cell.background && gaugeOptions.cell.background.color) {
                context.fillStyle = gaugeOptions.cell.background.color;
                context.fillRect(cellLayout.x, cellLayout.y, cellLayout.cellWidth, cellLayout.cellHeight);
            }
            context.restore();
        }

        /**
         * draw the gauge
         *
         * @param  object context the context of canvas
         * @param  object gaugeOptions the option of the gauge
         * @param  object layout the layout properties
         * @param  object cellLayout the cell layout properties
         * @param  string label the label of data
         * @param  number data the value of the gauge
         */
        function drawGauge(context, gaugeOptions, layout, cellLayout, label, data) {
            log("flot.gauges.drawGauge");

            log("gaugeOptions.gauge.shadow.show", gaugeOptions.gauge.shadow.show);
            log("gaugeOptions.gauge.shadow.blur", gaugeOptions.gauge.shadow.blur);
            var blur = gaugeOptions.gauge.shadow.show ? gaugeOptions.gauge.shadow.blur : 0;

            // draw gauge frame
            drawArcWithShadow(
                context,
                cellLayout.cx, // center x
                cellLayout.cy, // center y
                layout.radius,
                layout.width,
                toRad(gaugeOptions.gauge.startAngle),
                toRad(gaugeOptions.gauge.endAngle),
                gaugeOptions.gauge.stroke.color,  // line color
                gaugeOptions.gauge.stroke.width,  // line width
                "white",           // fill color
                blur);

            // draw gauge
            var c1 = getColor(gaugeOptions, data);
            var a2 = calculateAngle(gaugeOptions, layout, data);
            drawArcWithShadow(
                context,
                cellLayout.cx, // center x
                cellLayout.cy, // center y
                layout.radius - 1,
                layout.width - 2,
                toRad(gaugeOptions.gauge.startAngle),
                toRad(a2),
                c1,           // line color
                1,            // line width
                c1,           // fill color
                blur);
        }

        /**
         * decide the color of the data from the threshold options
         *
         * @param  object gaugeOptions the option of the gauge
         * @param  number data the value of the gauge
         */
        function getColor(gaugeOptions, data) {
            var color;
            for (var i = 0; i < gaugeOptions.threshold.values.length; i++) {
                var threshold = gaugeOptions.threshold.values[i];
                color = threshold.color;
                if (data <= threshold.value) {
                    break;
                }
            }
            return color;
        }

        /**
         * calculate the angle of the data
         *
         * @param  object gaugeOptions the option of the gauge
         * @param  object layout the layout properties
         * @param  number data the value of the gauge
         */
        function calculateAngle(gaugeOptions, layout, data) {
            var a =
                gaugeOptions.gauge.startAngle
                    + (gaugeOptions.gauge.endAngle - gaugeOptions.gauge.startAngle)
                        * ((data - gaugeOptions.gauge.min) / (gaugeOptions.gauge.max - gaugeOptions.gauge.min));

            if (a < gaugeOptions.gauge.startAngle) {
                a = gaugeOptions.gauge.startAngle;
            } else if (a > gaugeOptions.gauge.endAngle) {
                a = gaugeOptions.gauge.endAngle;
            }
            return a;
        }

        /**
         * draw the arc of the threshold
         *
         * @param  object context the context of canvas
         * @param  object gaugeOptions the option of the gauge
         * @param  object layout the layout properties
         * @param  object cellLayout the cell layout properties
         */
        function drawThreshold(context, gaugeOptions, layout, cellLayout) {
            log("flot.gauges.drawThreshold");
            var a1 = gaugeOptions.gauge.startAngle;
            for (var i = 0; i < gaugeOptions.threshold.values.length; i++) {
                var threshold = gaugeOptions.threshold.values[i];
                c1 = threshold.color;
                a2 = calculateAngle(gaugeOptions, layout, threshold.value);
                drawArc(
                    context,
                    cellLayout.cx, // center x
                    cellLayout.cy, // center y
                    layout.radius + layout.thresholdWidth,
                    layout.thresholdWidth - 2,
                    toRad(a1),
                    toRad(a2),
                    c1,           // line color
                    1,            // line width
                    c1);          // fill color
                a1 = a2;
            }
        }

        /**
         * draw an arc
         *
         * @param  object context the context of canvas
         * @param  number cx the x position of the center
         * @param  number cy the y position of the center
         * @param  number r the radius of an arc
         * @param  number w the width of an arc
         * @param  number rd1 the start angle of an arc in radians
         * @param  number rd2 the end angle of an arc in radians
         * @param  string lc the color of a line
         * @param  number lw the widht of a line
         * @param  string fc the fill color  of an arc
         */
        function drawArc(context, cx, cy, r, w, rd1, rd2, lc, lw, fc) {
            if (rd1 == rd2) {
                return;
            }
            var counterClockwise = false;
            context.save();
            context.beginPath();
            context.arc(cx, cy, r, rd1, rd2, counterClockwise);
            context.lineTo(cx + (r - w) * Math.cos(rd2),
                           cy + (r - w) * Math.sin(rd2));
            context.arc(cx, cy, r - w, rd2, rd1, !counterClockwise);
            context.closePath();
            if (lw) {
                context.lineWidth = lw;
            }
            if (lc) {
                context.strokeStyle = lc;
                context.stroke();
            }
            if (fc) {
                context.fillStyle = fc;
                context.fill();
            }
            context.restore();
        }

        /**
         * draw an arc with a shadow
         *
         * @param  object context the context of canvas
         * @param  number cx the x position of the center
         * @param  number cy the y position of the center
         * @param  number r the radius of an arc
         * @param  number w the width of an arc
         * @param  number rd1 the start angle of an arc in radians
         * @param  number rd2 the end angle of an arc in radians
         * @param  string lc the color of a line
         * @param  number lw the widht of a line
         * @param  string fc the fill color  of an arc
         * @param  number blur the shdow blur
         */
        function drawArcWithShadow(context, cx, cy, r, w, rd1, rd2, lc, lw, fc, blur) {
            if (rd1 == rd2) {
                return;
            }
            context.save();

            drawArc(context, cx, cy, r, w, rd1, rd2, lc, lw, fc);

            log("blur", blur);
            if (blur) {
                drawArc(context, cx, cy, r, w, rd1, rd2);
                context.clip();
                context.shadowOffsetX = 0;
                context.shadowOffsetY = 0;
                context.shadowBlur = 10;
                context.shadowColor = "gray";
                drawArc(context, cx, cy, r + 1, w + 2, rd1, rd2, lc, 1);                
            }
            context.restore();
        }

        /**
         * draw the label of the gauge
         *
         * @param  object placeholder the jQuery object of the placeholder
         * @param  object gaugeOptions the option of the gauge
         * @param  object layout the layout properties
         * @param  object cellLayout the cell layout properties
         * @param  number i the index of the series
         * @param  object item the item of the series
         */
        function drawLable(placeholder, gaugeOptions, layout, cellLayout, i, item) {
            log("flot.gauges.drawLable");
            drawText(
                placeholder,
                cellLayout.cx,
                cellLayout.y + cellLayout.cellMargin + layout.labelMargin + cellLayout.offsetY,
                "flotGagueLabel" + i,
                gaugeOptions.label.formatter ? gaugeOptions.label.formatter(item.label, item.data[0][1]) : text,
                gaugeOptions.label);
        }

        /**
         * draw the value of the gauge
         *
         * @param  object placeholder the jQuery object of the placeholder
         * @param  object gaugeOptions the option of the gauge
         * @param  object layout the layout properties
         * @param  object cellLayout the cell layout properties
         * @param  number i the index of the series
         * @param  object item the item of the series
         */
        function drawValue(placeholder, gaugeOptions, layout, cellLayout, i, item) {
            log("flot.gauges.drawValue");
            drawText(
                placeholder,
                cellLayout.cx,
                cellLayout.cy - (gaugeOptions.value.font.size / 2),
                "flotGagueValue" + i,
                gaugeOptions.value.formatter ? gaugeOptions.value.formatter(item.label, item.data[0][1]) : text,
                gaugeOptions.value);
        }

        /**
         * draw the values of the threshold
         *
         * @param  object placeholder the jQuery object of the placeholder
         * @param  object gaugeOptions the option of the gauge
         * @param  object layout the layout properties
         * @param  object cellLayout the cell layout properties
         * @param  number i the index of the series
         */
        function drawThresholdValues(placeholder, gaugeOptions, layout, cellLayout, i) {
            log("flot.gauges.drawThresholdValues");
            // min, max
            drawThresholdValue(placeholder, gaugeOptions, layout, cellLayout, "Min" + i, gaugeOptions.gauge.min, gaugeOptions.gauge.startAngle);
            drawThresholdValue(placeholder, gaugeOptions, layout, cellLayout, "Max" + i, gaugeOptions.gauge.max, gaugeOptions.gauge.endAngle);
            // threshold values
            for (var j = 0; j < gaugeOptions.threshold.values.length; j++) {
                var threshold = gaugeOptions.threshold.values[j];
                if (threshold.value > gaugeOptions.gauge.min && threshold.value < gaugeOptions.gauge.max) {
                    var a = calculateAngle(gaugeOptions, layout, threshold.value);
                    drawThresholdValue(placeholder, gaugeOptions, layout, cellLayout, i + "_" + j, threshold.value, a);
                }
            }
        }

        /**
         * draw the value of the threshold
         *
         * @param  object placeholder the jQuery object of the placeholder
         * @param  object gaugeOptions the option of the gauge
         * @param  object layout the layout properties
         * @param  object cellLayout the cell layout properties
         * @param  number i the index of the series
         * @param  number value the value of the threshold
         * @param  number a the angle of the value drawn
         */
        function drawThresholdValue(placeholder, gaugeOptions, layout, cellLayout, i, value, a) {
            drawText(
                placeholder,
                cellLayout.cx
                    + ((layout.thresholdLabelMargin + (layout.thresholdLabelFontSize / 2) + layout.radius)
                        * Math.cos(toRad(a))),
                cellLayout.cy
                    + ((layout.thresholdLabelMargin + (layout.thresholdLabelFontSize / 2) + layout.radius)
                        * Math.sin(toRad(a))),
                "flotGagueThresholdValue" + i,
                gaugeOptions.threshold.label.formatter ? gaugeOptions.threshold.label.formatter(value) : value,
                gaugeOptions.threshold.label,
                a);
        }

        /**
         * draw a text
         *
         * the textOptions is assumed as follows:
         *
         *   textOptions: {
         *       background: {
         *           color: null,
         *           opacity: 0
         *       },
         *       font: {
         *           size: "auto"
         *           family: "\"ＭＳ ゴシック\",sans-serif"
         *       },
         *       color: null
         *   }
         *
         *
         * @param  object placeholder the jQuery object of the placeholder
         * @param  number x the x position of the text drawn (left top)
         * @param  number y the y position of the text drawn (left top)
         * @param  string id the id of the dom element
         * @param  string text the text drawn
         * @param  object textOptions the option of the text
         * @param  number a the angle of the value drawn
         */
        function drawText(placeholder, x, y, id, text, textOptions, a) {
            var span = $("#" + id);
            var exists = span.length;
            if (!exists) {
                span = $("<span></span>")
                span.attr("id", id);
                span.css("position", "absolute");
                span.css("top", y + "px");
                if (textOptions.font.size) {
                    span.css("font-size", textOptions.font.size + "px");
                }
                if (textOptions.font.family) {
                    span.css("font-family", textOptions.font.family);
                }
                if (textOptions.color) {
                    span.css("color", textOptions.color);
                }
                if (textOptions.background.color) {
                    span.css("background-color", textOptions.background.color);
                }
                if (textOptions.background.opacity) {
                    span.css("opacity", textOptions.background.opacity);
                }
                placeholder.append(span);
            }
            span.text(text);
            // after append, readjust the left position
            span.css("left", x + "px"); // for redraw, resetting the left position is needed here
            span.css("left", (parseInt(span.css("left")) - (span.width()/ 2)) + "px");

            // at last, set angle
            if (!exists && a) {
                span.css("top", (parseInt(span.css("top")) - (span.height()/ 2)) + "px");
                span.css("transform", "rotate(" + ((180 * a) + 90) + "deg)"); // not supported for ie8
            }
        }

    } // end init function

    // define gauge specific options and their default values
    var defaults = {
        series: {
            gauges: {
                debug: {
                    log: false,
                    layout: false,
                    alert: false
                },
                show: true,
                layout: {
                    margin: 5,
                    columns: 3,
                    hMargin: 5,
                    vMargin: 5,
                    square: false
                },
                cell: {
                    background: {
                        color: null
                    },
                    border: {
                        color: "black",
                        width: 1
                    },
                    margin: 5,
                    vAlign: "middle" // 'top' or 'middle' or 'bottom'
                },
                gauge: {
                    width: "auto", // a specified number, or 'auto'
                    startAngle: 0.9, // 0 - 2 factor of the radians
                    endAngle: 2.1, // 0 - 2 factor of the radians
                    min: 0,
                    max: 100,
                    shadow: {
                        show: true,
                        blur: 5
                    },
                    stroke: {
                        color: "lightgray",
                        width: 2
                    }
                },
                label: {
                    show: true,
                    margin: "auto", // a specified number, or 'auto'
                    background: {
                        color: null,
                        opacity: 0
                    },
                    font: {
                        size: "auto", // a specified number, or 'auto'
                        family: "sans-serif"
                    },
                    color: null,
                    formatter: function(label, value) {
                        return label;
                    }
                },
                value: {
                    show: true,
                    margin: "auto", // a specified number, or 'auto'
                    background: {
                        color: null,
                        opacity: 0
                    },
                    font: {
                        size: "auto", // a specified number, or 'auto'
                        family: "sans-serif"
                    },
                    color: null,
                    formatter: function(label, value) {
                        return parseInt(value);
                    }
                },
                threshold: {
                    show: true,
                    width: "auto", // a specified number, or 'auto'
                    label: {
                        show: true,
                        margin: "auto", // a specified number, or 'auto'
                        background: {
                            color: null,
                            opacity: 0
                        },
                        font: {
                            size: "auto", // a specified number, or 'auto'
                            family: ",sans-serif"
                        },
                        color: null,
                        formatter: function(value) {
                            return value;
                        }
                    },
                    values: [
                        {
                            value: 50,
                            color: "lightgreen"
                        }, {
                            value: 80,
                            color: "yellow"
                        }, {
                            value: 100,
                            color: "red"
                        },
                    ]
                }
            }
        }
    };

    // register the gauge plugin
    $.plot.plugins.push({
        init: init,
        options: defaults,
        name: "gauge",
        version: "1.0"
    });

})(jQuery);
