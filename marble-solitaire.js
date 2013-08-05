/*
	This file is part of: Marble-Solitaire (c) 2013 J. Kaiden
	https://github.com/lljk/jscorecard
	licensed under a Creative Commons Attribution-NonCommercial 3.0 Unported License.
	http://creativecommons.org/licenses/by-nc/3.0/deed.en_US
*/

$('document').ready(function(){
		
		var board = $('#board'), can_drop = false,  legal_jump = false, to_cell = null, undo_array = [];
		board.draggable();
		board.mousedown(function(){return false});
		var resize_btn = $('<div id="resize_button">&#164</div>');
		var undo_btn = $('<div id="undo_button">\<\<</div>');
		
		var board_array = [[8,8,8,1,1,1,8,8,8],
																		[8,8,8,1,1,1,8,8,8],
																		[8,8,8,1,1,1,8,8,8],
																		[1,1,1,1,1,1,1,1,1],
																		[1,1,1,1,0,1,1,1,1],
																		[1,1,1,1,1,1,1,1,1],
																		[8,8,8,1,1,1,8,8,8],
																		[8,8,8,1,1,1,8,8,8],
																		[8,8,8,1,1,1,8,8,8]
		];
		
		make_board();
		
		function make_board() {
			board.empty();
			undo_btn.click(function(){undo_move()})
			resize_btn.mousedown(function(event){resize_board(event)});
			undo_btn.mouseenter(function() {tooltip(undo_btn, 'undo')});
			resize_btn.mouseenter(function(event) {tooltip(resize_btn, 'resize')});
			board.append(undo_btn);
			board.append(resize_btn);
			
			var r_num = -1;
			$(board_array).each(function(i, p_row){
				c_num = -1;
				r_num += 1;
				var row = $('<div class="row" id="row' + r_num + '"></div>');
				board.append(row);
				$(p_row).each(function(i, position) {
						c_num += 1;
						row.append('<div class="position" id="pos' + r_num + c_num + '"></div>');
						var pos = $('#pos' + r_num + c_num);
						var cell = $('<div class="cell" id="cell' + r_num + c_num + '"></div>');
						var marble = $('<div class="marble" id="marble' + r_num + c_num + '"><div></div></div>')
						switch (position) {
						case 8:
							pos.attr('cell', false); break;
						case 1:
							pos.append(cell);
							cell.append(marble);
							pos.attr('cell', true);
							pos.attr('occupied', true);
							cell.attr('occupied', true);
							cell.attr('pos', [r_num, c_num]);
							marble.attr('pos', [r_num, c_num]);
							marble.draggable({zIndex: 100, stop: function(){drop_marble(event, marble)}, drag: function(){check_drop(event, marble)}, snap: '.cell', snapMode: 'inner', revert: true});
							marble.draggable('disable')
							marble.mouseenter(function(){check_marble(marble)});
							marble.mousedown(function(){marble.children().css('box-shadow', 'none')});
							marble.mouseup(function(){
									marble.children().css('box-shadow', '1px 5px 10px #050505');
									check_marble(marble);
							});
							marble.attr('drop_north', false); marble.attr('drop_south', false);
							marble.attr('drop_east', false); marble.attr('drop_west', false);
							break;
						case 0:
							pos.append(cell);
							pos.attr('cell', true);
							pos.attr('occupied', false);
							cell.attr('occupied', false);
							cell.attr('pos', [r_num, c_num]);
							break;
						};
				});
			});
		};
		
		function check_marble(marble) {
			var row = parseInt(marble.attr('pos')[0]), col = parseInt(marble.attr('pos')[2]);
			var north1 = board_array[row - 1] ? board_array[row - 1][col] : null
			var south1 = board_array[row + 1] ? board_array[row + 1][col] : null
			var east1 = board_array[col + 1] ? board_array[row][col + 1] : null
			var west1 = board_array[col - 1] ? board_array[row][col - 1] : null
			var north2 = board_array[row - 2] ? board_array[row - 2][col] : null
			var south2 = board_array[row + 2] ? board_array[row + 2][col] : null
			var east2 = board_array[col + 2] ? board_array[row][col + 2] : null
			var west2 = board_array[col - 2] ? board_array[row][col - 2] : null
			
			marble.draggable('disable'); marble.draggable('option', 'revert', true); can_drop = false;
			
			if (north1 == 1 && north2 == 0) {enable('drop_north', row - 2, col)}
			else {disable('drop_north')};
			if (south1 == 1 && south2 == 0) {enable('drop_south', row + 2, col)}
			else {disable('drop_south')};
			if (east1 == 1 && east2 == 0) {enable('drop_east', row, col + 2)}
			else {disable('drop_east')};
			if (west1 == 1 && west2 == 0) {enable('drop_west', row, col - 2)}
			else {disable('drop_west')};
			
			function enable(drop_dir, row, col) {
				marble.attr(drop_dir, [row, col]);
				marble.draggable('enable');
				marble.draggable('option', 'revert', false);
				can_drop = true;
			};
			
			function disable(drop_dir) {
				marble.attr(drop_dir, false);
				marble.css('left', 0); marble.css('top', 0);
			};
		};
		
		function check_drop(event, marble){
			to_cell = null
			var size = parseInt(marble.css('width'));
			var left_travel = marble.position().left, top_travel = marble.position().top;
			if (left_travel > size * 1.9 && left_travel < size * 2.9) {to_cell = "east"; legal_jump = true}
			else if (left_travel < size * -1.9 && left_travel > size * -2.9 ) {to_cell = "west"; legal_jump = true};
			if (top_travel > size * 1.9 && top_travel < size * 2.9) {to_cell = "south"; legal_jump = true}
			else if (top_travel < size * -1.9 && top_travel > size * -2.9) {to_cell = "north"; legal_jump = true};
		};
		
		function drop_marble(event, marble) {
			if (can_drop && legal_jump && marble.attr('drop_' + to_cell) && marble.attr('drop_' + to_cell) != 'false') {
			var m_row = parseInt(marble.attr('pos')[0]), m_col = parseInt(marble.attr('pos')[2]);
			var drop_row = parseInt(marble.attr('drop_' + to_cell)[0]);
			var drop_col = parseInt(marble.attr('drop_' + to_cell)[2]);
			var remove_row = (m_row + drop_row) / 2, remove_col = (m_col + drop_col) / 2;			
			
			$('#cell' + remove_row + remove_col).empty();
			$('#cell' + remove_row + remove_col).attr('occupied', false);
			$('#cell' + m_row + m_col).attr('occupied', false);
			
			$('#cell' + drop_row + drop_col).attr('occupied', true);
			$('#cell' + drop_row + drop_col).append(marble);
			marble.css('left', 0); marble.css('top', 0);
			marble.attr('pos', [drop_row, drop_col]);
			marble.attr('drop_north', false); marble.attr('drop_south', false);
			marble.attr('drop_east', false); marble.attr('drop_west', false);
			
			undo_array = board_array.slice(0);
			$(board_array).each(function (i, row) {undo_array[i] = row.slice(0)});
			board_array[m_row][m_col] = 0;
			board_array[remove_row][remove_col] = 0;
			board_array[drop_row][drop_col] = 1;
			};			
		};
		
		function undo_move() {
			$(undo_array).each(function (i, row) {board_array[i] = row.slice(0)});
			make_board();
		};
		
		function resize_board(click_event) {
			board.draggable('disable');
			
			var start_x = event.pageX, start_width = parseInt(board.css('width'));
			var end_x = start_x
			
			$('body').mousemove(function(move_event) {
					end_x = move_event.pageX;
					var new_width = start_width - (start_x - end_x);
					board.css('width', new_width);
			})
			
			$('body').mouseup(function(up_event) {
					board.draggable('enable');
					$('body').off('mouseup');
					$('body').off('mousemove');
			});
		};	
		
		function tooltip(button, text) {
			var tooltip = $('<div class="tooltip">' + text + '</div>');
			var left = button[0].offsetLeft, top = button[0].offsetTop - 15;
			tooltip.css('left', left);
			tooltip.css('top', top);
			var timeout = setTimeout(function(){board.append(tooltip)}, 1500);
			button.mouseleave(function(){tooltip.remove(); clearTimeout(timeout)});
		};
		
}); /// EOF ///