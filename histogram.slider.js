; (function ($, window, document, undefined) {
    var pluginName = "histogramSlider",
        dataKey = "plugin_" + pluginName;

    var updateHistogram = function (selectedRange, sliderMin, rangePerBin, histogramName, sliderName) {
        var leftValue = selectedRange[0],
            rightValue = selectedRange[1];

        $("#slider-left-value").val(leftValue);
        $("#slider-right-value").val(rightValue); 

        $("#slider-left-value, #slider-right-value").on("input", function() {
            var leftValue = parseInt($("#slider-left-value").val()) || 0;
            var rightValue = parseInt($("#slider-right-value").val()) || 0;
        
            // Check if rightValue is less than selectedRange[0]
            if (rightValue < selectedRange[0]) {
                rightValue = selectedRange[0];
                $("#slider-right-value").val(rightValue); // Update input field
            }
        
            // Update histogram with new values
            updateHistogram([leftValue, rightValue], sliderMin, rangePerBin, histogramName, sliderName);
        });
        

        $("#" + sliderName).slider("values", [leftValue, rightValue]);
            

        // set opacity per bin based on the slider values
        $("#" + histogramName + " .in-range").each(function (index, bin) {
            var binRange = getBinRange(rangePerBin, index, sliderMin);

            if (binRange[1] < rightValue) {
                // Set opacity based on left (min) slider
                if (leftValue > binRange[1]) {
                    setOpacity(bin, 0);
                } else if (leftValue < binRange[0]) {
                    setOpacity(bin, 1);
                } else {
                    //setOpacity(bin, 1);
                    setOpacity(bin, 1 - (leftValue - binRange[0]) / rangePerBin);
                }
            } else if (binRange[0] > leftValue) {
                // Set opacity based on right (max) slider value
                if (rightValue > binRange[1]) {
                    setOpacity(bin, 1);
                } else if (rightValue < binRange[0]) {
                    setOpacity(bin, 0);
                } else {
                    //setOpacity(bin, 1);
                    setOpacity(bin, (rightValue - binRange[0]) / rangePerBin);
                }
            }
        });
    };

    var getBinRange = function(rangePerBin, index, sliderMin) {
        var min = (rangePerBin * index) + sliderMin,
            max = rangePerBin * (index + 1) - 1;

        return [min, max];
    }

    var setOpacity = function(bin, val) {
        $(bin).css("opacity", val);
    };

    var convertToHeight = function (v) {
        return parseInt(5 * v + 1);
    }

    var calculateHeightRatio = function(bins, histogramHeight) {
        var maxValue = Math.max.apply(null, bins);
        var height = convertToHeight(maxValue);

        if (height > histogramHeight) {
            return histogramHeight / height;
        }

        return 1;
    }

    var Plugin = function (element, options) {
        this.element = element;

        this.options = {
            sliderRange: [0, 1000000], // Min and Max slider values
            selectedRange: [0, 0], // Min and Max slider values selected
            height: 200,
            numberOfBins: 40,
            showTooltips: false,
            showSelectedRange: false
        };

        this.init(options);
    };

    Plugin.prototype = {
        init: function (options) {
            $.extend(this.options, options);

            var self = this,
                dataItems = self.options.data.items,
                bins = new Array(this.options.numberOfBins).fill(0),
                range = self.options.sliderRange[1] - self.options.sliderRange[0],
                rangePerBin = range / this.options.numberOfBins;;

            for (i = 0; i < dataItems.length; i++) {
                var index = parseInt(dataItems[i].value / rangePerBin),
                    increment = 1;

                if (dataItems[i].count) {
                    // Handle grouped data structure
                    increment = parseInt(dataItems[i].count);
                }

                bins[index] += increment;
            }

            var histogramName = self.element.attr('id') + "-histogram",
                sliderName = self.element.attr('id') + "-slider";

            var wrapHtml = "<div id='" + histogramName + "' style='height:" + self.options.height + "px; overflow: hidden;'></div>" +
                "<div id='" + sliderName + "'></div>";

            self.element.html(wrapHtml);

            var heightRatio = calculateHeightRatio(bins, self.options.height),
                widthPerBin = 100 / this.options.numberOfBins;

            for (i = 0; i < bins.length; i++) {
                var binRange = getBinRange(rangePerBin, i, this.options.sliderRange[0]),
                    inRangeClass = "bin-color-selected",
                    outRangeClass = "bin-color";

                var scaledValue = parseInt(bins[i] * heightRatio),
                    height = convertToHeight(scaledValue),
                    inRangeOffset = parseInt(self.options.height - height),
                    outRangeOffset = -parseInt(self.options.height - height * 2);

                var binHtml = "<div class='tooltip' style='float:left!important;width:" + widthPerBin + "%;'>" +
                    "<div class='bin in-range " + inRangeClass + "' style='height:" + height + "px;bottom:-" + inRangeOffset + "px;position: relative;'></div>" +
                    "<div class='bin out-of-range " + outRangeClass + "' style='height:" + height + "px;bottom:" + outRangeOffset + "px;position: relative;'></div>" +
                    "</div>";

                $("#" + histogramName).append(binHtml);
            }

            $("#" + sliderName).slider({
                range: true,
                min: self.options.sliderRange[0],
                max: self.options.sliderRange[1],
                values: self.options.selectedRange,
                slide: function (event, ui) {
                    updateHistogram(ui.values, self.options.sliderRange[0], rangePerBin, histogramName, sliderName);
                }
            });

            updateHistogram(self.options.selectedRange, self.options.sliderRange[0], rangePerBin, histogramName, sliderName);
        }
    };

    $.fn[pluginName] = function (options) {
        var plugin = this.data(dataKey);

        if (plugin instanceof Plugin) {
            if (typeof options !== 'undefined') {
                plugin.init(options);
            }
        } else {
            plugin = new Plugin(this, options);
            this.data(dataKey, plugin);
        }

        return plugin;
    };

}(jQuery, window, document));
