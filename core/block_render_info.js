// New constants.
Blockly.BlockSvg.EMPTY_INPUT_X = Blockly.BlockSvg.TAB_WIDTH +
          Blockly.BlockSvg.SEP_SPACE_X * 1.25;

Blockly.BlockSvg.START_PADDING = Blockly.BlockSvg.SEP_SPACE_X - 1;

Blockly.BlockSvg.STATEMENT_BOTTOM_HEIGHT = Blockly.BlockSvg.SEP_SPACE_Y - 1;

Blockly.BlockSvg.EMPTY_INPUT_Y = Blockly.BlockSvg.MIN_BLOCK_Y;//Blockly.BlockSvg.MIN_BLOCK_Y - 5;

Blockly.BlockSvg.RenderInfo = function() {
  /**
   *
   * @type {boolean}
   */
  this.startHat = false;

  /**
   *
   * @type {boolean}
   */
  this.squareTopLeftCorner = false;

  /**
   *
   * @type {boolean}
   */
  this.squareBottomLeftCorner = false;

  /**
   *
   * @type {boolean}
   */
  this.hasValue = false;

  /**
   *
   * @type {boolean}
   */
  this.hasStatement = false;

  /**
   *
   * @type {boolean}
   */
  this.hasDummy = false;

  this.hasIcons = false;

  this.iconCount = 0;

  /**
   *
   * @type {number}
   */
  this.height = 0;

  /**
   *
   * @type {number}
   */
  this.width = 0;

  /**
   *
   * @type {number}
   */
  this.rightEdge = 0;

  /**
   *
   * @type {number}
   */
  this.statementEdge = 0;

  this.startPadding = Blockly.BlockSvg.START_PADDING;

  // topPadding should be unnecessary: this is the height of the first spacer
  // row.
  this.topPadding = Blockly.BlockSvg.SEP_SPACE_X / 2;

  this.rows = [];
};

Blockly.BlockSvg.renderComputeForRealThough = function(block) {
  var renderInfo = createRenderInfo(block);

  // measure passes:
  for (var r = 0; r < renderInfo.rows.length; r++) {
    var row = renderInfo.rows[r];
    for (var e = 0; e < row.elements.length; e++) {
      var elem = row.elements[e];
      elem.measure();
    }
  }
  addElemSpacing(renderInfo);


  renderInfo.maxWidth = 0;
  // Some arbitrary min width?
  renderInfo.maxValueOrDummyWidth = 60;
  for (var r = 0; r < renderInfo.rows.length; r++) {
    var row = renderInfo.rows[r];
    row.measure();
    renderInfo.maxWidth = Math.max(renderInfo.maxWidth, row.width);
    if (!row.hasStatement && !row.hasInlineInput) {
      renderInfo.maxValueOrDummyWidth =
          Math.max(renderInfo.maxValueOrDummyWidth, row.width);
    }
  }

  computeBounds(renderInfo);

  addRowSpacing(renderInfo);
  console.log(renderInfo);
  return renderInfo;
};

computeBounds = function(renderInfo) {
  var maxWidth = renderInfo.maxWidth;
  for (var r = 0; r < renderInfo.rows.length; r++) {
    var row = renderInfo.rows[r];
    if (!row.hasStatement && !row.hasInlineInput) {
      row.width = maxWidth;
    }
  }
};

addRowSpacing = function(info) {
  var oldRows = info.rows;
  var newRows = [];
  newRows.push(new RowSpacer(5, info.maxWidth));

  for (var r = 0; r < oldRows.length; r++) {
    newRows.push(oldRows[r]);
    var spacing = calculateSpacingBetweenRows(oldRows[r], oldRows[r + 1]);
    var width = calculateWidthOfSpacerRow(oldRows[r], oldRows[r + 1], info);
    newRows.push(new RowSpacer(spacing, width));
  }
  info.rows = newRows;
};

calculateWidthOfSpacerRow = function(prev, next, info) {
  if (!prev) {
    return info.maxWidth;
  }

  // spacer row after the last statement input.
  if (!next && prev.hasStatement) {
    return info.maxValueOrDummyWidth;
  }

  return info.maxWidth;
};


calculateSpacingBetweenRows = function(prev, next) {
  // First row is always (?) 5.
  if (!prev) {
    return 5;
  }

  // Slightly taller row after the last statement input.
  if (!next && prev.hasStatement) {
    return 10;
  }

  if (!next) {
    return 5;
  }

  if (prev.hasExternalInput && next.hasExternalInput) {
    return 10;
  }
  return 5;
};

addElemSpacing = function(info) {
  for (var r = 0; r < info.rows.length; r++) {
    var row = info.rows[r];
    var oldElems = row.elements;
    var newElems = [];
    // Could probably do this by starting the loop at -1 or stopping it one late.
    // Will need to do the same for rows.
    newElems.push(new ElemSpacer(calculateSpacingBetweenElems(null, oldElems[0])));
    for (var e = 0; e < row.elements.length; e++) {
      newElems.push(oldElems[e]);
      var spacing = calculateSpacingBetweenElems(oldElems[e], oldElems[e + 1]);
      newElems.push(new ElemSpacer(spacing));
    }
    row.elements = newElems;
  }
};

calculateSpacingBetweenElems = function(prev, next) {
  if (!prev) {
    // Between an editable field and the beginning of the row.
    if (next instanceof FieldElement && next.isEditable) {
      return 5;
    }
    // Inline input at the beginning of the row.
    if (next.isInput && next instanceof InlineInputElement) {
      return 9;
    }
    // Anything else at the beginning of the row.
    return 10;
  }

  // Spacing between a field or icon and the end of the row.
  if (!prev.isInput && !next) {
    // Between an editable field and the end of the row.
    if (prev instanceof FieldElement && prev.isEditable) {
      return 5;
    }
    // Between noneditable fields and icons and the end of the row.
    return 10;
  }

  // Between inputs and the end of the row.
  if (prev.isInput && !next) {
    if (prev instanceof ExternalValueInputElement) {
      return 0;
    } else if (prev instanceof InlineInputElement) {
      return 10;
    } else if (prev instanceof StatementInputElement) {
      return 0;
    }
  }

  // Between anything else and the end of the row?  Probably gets folded into the
  // previous two checks.
  if (!next) {
    return 5;
  }

  // Spacing between a field or icon and an input.
  if (!prev.isInput && next.isInput) {
    // Between an editable field and an input.
    if (prev.isEditable) {
      if (next instanceof InlineInputElement) {
        return 3;
      } else if (next instanceof ExternalValueInputElement) {
        return 5;
      }
    }
    return 9;
  }

  // Spacing between an icon and an icon or field.
  if (prev instanceof IconElement && !next.isInput) {
    return 11;
  }

  // Spacing between an inline input and a field.
  if (prev instanceof InlineInputElement && !next.isInput) {
    // Editable field after inline input.
    if (next.isEditable) {
      return 5;
    } else {
      // Noneditable field after inline input.
      return 10;
    }
  }

  return 5;
};

createRenderInfo = function(block) {
  var info = new Blockly.BlockSvg.RenderInfo();
  info.startHat = this.hat ? this.hat === 'cap' : Blockly.BlockSvg.START_HAT;

  setShouldSquareCorners(block, info);
  setHasStuff(block, info);

  createRows(block, info);
  return info;
};

completeInfo = function(info) {
  var statementEdge = 0;
  var rightEdge = 0;
  for (var r = 1; r < info.rows.length - 1; r += 2) {
    var row = info.rows[r];
    // This is the width of a block where statements are nested.
    statementEdge = Math.max(statementEdge, row.statementWidth);
    rightEdge = Math.max(rightEdge, row.fieldValueWidth);
  }

  // The right edge of non-statement rows should extend past the width of the
  // statement notches.
  if (info.hasStatement) {
    rightEdge = Math.max(rightEdge,
        statementEdge + Blockly.BlockSvg.NOTCH_WIDTH);
  }


  // start padding is added equally to everything.
  info.statementEdge = statementEdge + info.startPadding;
  info.rightEdge = rightEdge + info.startPadding;

  // if (hasValue) {
  //   rightEdge = Math.max(rightEdge, fieldValueWidth +
  //       Blockly.BlockSvg.SEP_SPACE_X * 2 + Blockly.BlockSvg.TAB_WIDTH);
  // } else if (hasDummy) {
  //   rightEdge = Math.max(rightEdge, fieldValueWidth +
  //       Blockly.BlockSvg.SEP_SPACE_X * 2);
  // }


  for (var i = 0; i < info.rows.length; i++) {
    var row = info.rows[i];
    info.height += row.height;
    info.width = Math.max(info.width, row.width);
  }
  // Fuck it, add some padding.
  info.width = info.width + info.startPadding;
};

shouldStartNewRow = function(input, lastInput, isInline) {
  // If this is the first input, just add to the existing row.
  // That row is either empty or has some icons in it.
  if (!lastInput) {
    return false;
  }

  // A statement input always gets a new row.
  if (input.type == Blockly.NEXT_STATEMENT) {
    return true;
  }

  // External value inputs get their own rows.
  if (input.type == Blockly.INPUT_VALUE && !isInline) {
    return true;
  }

  return false;
};

createRows = function(block, info) {
  // necessary data
  var isInline = block.getInputsInline() && !block.isCollapsed();
  info.isInline = isInline;

  var rowArr = [];
  var activeRow = new Row();

  var icons = block.getIcons();
  if (icons.length) {
    for (var i = 0; i < icons.length; i++) {
      activeRow.elements.push(new IconElement(icons[i]));
    }
  }

  for (var i = 0; i < block.inputList.length; i++) {
    var input = block.inputList[i];
    if (shouldStartNewRow(input, block.inputList[i - 1], isInline)) {
      rowArr.push(activeRow);
      activeRow = new Row();
    }
    for (var f = 0; f < input.fieldRow.length; f++) {
      var field = input.fieldRow[f];
      activeRow.elements.push(new FieldElement(field));
    }

    if (isInline && input.type == Blockly.INPUT_VALUE) {
      activeRow.elements.push(new InlineInputElement(input));
      activeRow.hasInlineInput = true;
    } else if (input.type == Blockly.NEXT_STATEMENT) {
      activeRow.elements.push(new StatementInputElement(input));
      activeRow.hasStatement = true;
    } else if (input.type == Blockly.INPUT_VALUE) {
      activeRow.elements.push(new ExternalValueInputElement(input));
      activeRow.hasExternalInput = true;
    }
  }

  if (activeRow.elements.length) {
    rowArr.push(activeRow);
  }

  info.rows = rowArr;
};

setShouldSquareCorners = function(block, info) {
  var prevBlock = block.getPreviousBlock();
  var nextBlock = block.getNextBlock();

  info.squareTopLeftCorner =
      !!block.outputConnection ||
      info.startHat ||
      (prevBlock && prevBlock.getNextBlock() == this);

  info.squareBottomLeftCorner = !!block.outputConnection || !!nextBlock;
};

setHasStuff = function(block, info) {
  for (var i = 0; i < block.inputList.length; i++) {
    var input = block.inputList[i];
    if (input.type == Blockly.DUMMY_INPUT) {
      info.hasDummy = true;
    } else if (input.type == Blockly.INPUT_VALUE) {
      info.hasValue = true;
    } else if (input.type == Blockly.NEXT_STATEMENT) {
      info.hasStatement = true;
    } else {
      throw new Error('what why');
    }
  }
};

IconElement = function(icon) {
  this.isInput = false;
  this.width = 0;
  this.height = 0;
  this.icon = icon;
  this.isVisible = icon.isVisible();
  this.renderRect = null;
  this.type = 'icon';
};

IconElement.prototype.measure = function() {
  this.height = 16;
  this.width = 16;
};

FieldElement = function(field) {
  this.isInput = false;
  this.width = 0;
  this.height = 0;
  this.field = field;
  this.renderRect = null;
  this.isEditable = field.isCurrentlyEditable();
  this.type = 'field';
};

FieldElement.prototype.measure = function() {
  var size = this.field.getCorrectedSize();
  this.height = size.height;
  this.width = size.width;
};

InlineInputElement = function(input) {
  this.isInput = true;
  this.width = 0;
  this.height = 0;
  this.input = input;
  this.connectedBlock = input.connection && input.connection.targetBlock() ?
      input.connection.targetBlock() : null;

  if (this.connectedBlock) {
    var bBox = this.connectedBlock.getHeightWidth();
    this.connectedBlockWidth = bBox.width;
    this.connectedBlockHeight = bBox.height;
  } else {
    this.connectedBlockWidth = 0;
    this.connectedBlockHeight = 0;
  }
  this.type = 'inline input';
};

InlineInputElement.prototype.measure = function() {
  this.width = 22;
  this.height = 26;
};

StatementInputElement = function(input) {
  this.isInput = true;
  this.width = 0;
  this.height = 0;
  this.input = input;
  this.connectedBlock = input.connection && input.connection.targetBlock() ?
      input.connection.targetBlock() : null;

  if (this.connectedBlock) {
    var bBox = this.connectedBlock.getHeightWidth();
    this.connectedBlockWidth = bBox.width;
    this.connectedBlockHeight = bBox.height;
  } else {
    this.connectedBlockWidth = 0;
    this.connectedBlockHeight = 0;
  }
  this.type = 'statement input';
};

StatementInputElement.prototype.measure = function() {
  if (!this.connectedBlock) {
    this.height = 24;
    this.width = 32;
  } else {
    this.width = 25;
    this.height = this.connectedBlockHeight;
  }
};

ExternalValueInputElement = function(input) {
  this.isInput = true;
  this.width = 0;
  this.height = 0;

  this.input = input;
  this.connectedBlock = input.connection && input.connection.targetBlock() ?
      input.connection.targetBlock() : null;

  if (this.connectedBlock) {
    var bBox = this.connectedBlock.getHeightWidth();
    this.connectedBlockWidth = bBox.width;
    this.connectedBlockHeight = bBox.height;
  } else {
    this.connectedBlockWidth = 0;
    this.connectedBlockHeight = 0;
  }
  this.type = 'statement input';
};

ExternalValueInputElement.prototype.measure = function() {
  this.width = 10;
  this.height = 14.5;
};

Row = function() {
  this.elements = [];
  this.width = 0;
  this.height = 0;

  this.hasExternalInput = false;
  this.hasStatement = false;
  this.hasInlineInput = false;
};

Row.prototype.measure = function() {
  for (var e = 0; e < this.elements.length; e++) {
    var elem = this.elements[e];
    this.width += elem.width;
    if (!(elem instanceof ElemSpacer)) {
      this.height = Math.max(this.height, elem.height);
    }
  }
};

RowSpacer = function(height, width) {
  this.height = height;
  this.rect = null;
  this.width = width; // Only for visible rendering during debugging
};

ElemSpacer = function(width) {
  this.height = 15; // Only for visible rendering during debugging.

  this.width = width;
  this.rect = null;
};
