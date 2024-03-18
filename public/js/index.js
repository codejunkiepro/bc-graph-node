// const { op } = require("@tensorflow/tfjs");

var userId = '';
var analysisArray = [1.5, 2, 10, 100];
var analysisRanges = [10, 20, 30, 40, 50, 100, 200, 500, 1000];
var analysisPayoutAppear = [10, 220];
var gHash = localStorage.getItem('bc.game.crash.analysis.hashvalue');
let load_game_hash_input = localStorage.getItem('bc.game.crash.analysis.hashvalue');
let load_game_amount_input = localStorage.getItem('bc.game.crash.analysis.gameamount');
let load_game_red_thresold_input = localStorage.getItem('bc.game.crash.analysis.red');
let load_game_red_thresold_input_1 = localStorage.getItem('bc.game.crash.analysis.red1');
let load_game_high_input = localStorage.getItem('bc.game.crash.analysis.high');
let load_game_low_input = localStorage.getItem('bc.game.crash.analysis.low');
let load_game_table_rows_input = localStorage.getItem('bc.game.crash.analysis.tablerows');
let load_game_chart_size_input = localStorage.getItem('bc.game.crash.analysis.chartsize');
let load_game_analysis_input = localStorage.getItem('bc.game.crash.analysis.array');
let load_game_analysis_range_input = localStorage.getItem('bc.game.crash.analysis.range');
let load_game_analysis_payout_appear_indexes = localStorage.getItem('bc.game.crash.analysis.payout.appear.indexes');
let load_game_dotmap_height_input = localStorage.getItem('bc.game.crash.dotmap.height');
// load_game_hash_input = load_game_hash_input?load_game_hash_input:;
load_game_dotmap_height_input = load_game_dotmap_height_input ? load_game_dotmap_height_input : 6;
load_game_amount_input = load_game_amount_input ? load_game_amount_input : 100;
load_game_red_thresold_input = load_game_red_thresold_input ? load_game_red_thresold_input : 2;
load_game_red_thresold_input_1 = load_game_red_thresold_input_1 ? load_game_red_thresold_input_1 : 10;
load_game_high_input = load_game_high_input ? load_game_high_input : 20;
load_game_low_input = load_game_low_input ? load_game_low_input : 0;
load_game_table_rows_input = load_game_table_rows_input ? load_game_table_rows_input : 50;
load_game_chart_size_input = load_game_chart_size_input ? load_game_chart_size_input : 1000;
load_game_analysis_input = load_game_analysis_input ? load_game_analysis_input : '1.5,2,3,4,5,6,7,8,9,10,100';
load_game_analysis_range_input = load_game_analysis_range_input ? load_game_analysis_range_input : '1,2,3,4,5,10,20,50,100,200';
load_game_analysis_payout_appear_indexes = load_game_analysis_payout_appear_indexes ? load_game_analysis_payout_appear_indexes : '10,220';
$('#game_hash_input').val(load_game_hash_input);
$('#game_amount_input').val(load_game_amount_input);
$('#game_red_thresold_input').val(load_game_red_thresold_input);
$('#game_red_thresold_input_1').val(load_game_red_thresold_input_1);
$('#game_high_input').val(load_game_high_input);
$('#game_low_input').val(load_game_low_input);
$('#game_table_rows_input').val(load_game_table_rows_input);
$('#game_chart_size_input').val(load_game_chart_size_input);
$('#game_analysis_input').val(load_game_analysis_input);
$('#game_analysis_range_input').val(load_game_analysis_range_input);
$('#game_analysis_payout_appear_indexes').val(load_game_analysis_payout_appear_indexes);
$('#game_dotmap_height_input').val(load_game_dotmap_height_input);

let dots_cols = 0;
let maxDataN = 0;
let minDataN = 0;

function initDots() {
  let cols = Math.round($(window).width() / 16);
  $('.dots').empty();
  $('.value-map').empty();
  for (let i = 0; i < cols * load_game_dotmap_height_input; i++) {
    $('.dots').append('<div class="cell-dot type-0"></div>');
  }
  for (let i = 0; i < cols / 2; i++) {
    $('.value-map').append('<div class="cell-value"></div>');
  }
  $('.dots').css('display', 'grid');
  $('.dots').css('gap', '1px');
  $('.dots').css('grid-template-columns', `repeat(${cols}, 1fr)`);
  dots_cols = cols;

  $('.cell-value').on('click', (e) => {
    index = $(e.currentTarget).attr('index');
    $range.empty();
    analysisArray.forEach((v) => showRangeAnalysis(data, v, index));
  })

  $('.cell-dot').on('click', (e) => {
    index = $(e.currentTarget).attr('index');
    $range.empty();
    analysisArray.forEach((v) => showRangeAnalysis(data, v, index));
  })
}


const socket = io();
socket.io.on("error", (error) => {
  console.log(error);
});

socket.on("refresh", (hash) => {
  if (gHash == hash) {
  } else {
    gHash = hash;
    $('#game_hash_input').val(gHash);
    $('#game_verify_submit').click();

    let salt = $('#game_salt_input').val();
    let bust = salt.startsWith('0x') ? gameResultForEthercrash(hash, salt) : gameResult(hash, salt);
    if (bust >= 10) {
      notifyMe("Attention!!!", {
        body: `BC.GAME crashed on ${bust} just.`,
        icon: '/img/gold-coin.png',
      });
    } else {
      let dist = 0;
      for (let i = data.length - 1; i >= 0; i--, dist++) {
        if (data[i].bust >= 10) {
          break;
        }
      }
      if (dist >= 15 && dist % 5 == 0) {
        notifyMe("Attention!!!", {
          body: `BC.GAME doesn't give over 10x in ${dist} times.`,
          icon: '/img/bc.game.webp',
        });
      }
    }
  }
});

// Update hash
window.addEventListener('message', (event) => {
  if (event.data?.hash) {
    $('#game_hash_input').val(event.data?.hash);
    const gameAmount = Number($('#game_amount_input').val());
    verify(event.data?.hash, gameAmount);

    if (userId) {
      document.getElementById('ethercrash_user_rounds').attr('src', `https://www.ethercrash.io/user/${userId}`);
    }
  }
});

// making bulma.css tabs work
$('.tabs ul li a').click(function () {
  const $this = $(this),
    $tabs = $this.closest('.tabs'),
    $li = $this.closest('li'),
    $lis = $tabs.find('ul > li');
  const id = $tabs.attr('id'),
    index = $lis.index($li);
  $lis.removeClass('is-active');
  $li.addClass('is-active');
  $(`#${id}-content > div`).addClass('is-hidden');
  $(`#${id}-content > div:eq(${index})`).removeClass('is-hidden');
  $('#game_verify_submit').click();
});

function notifyMe(title, option) {
  if (!window.Notification) {
    console.log('Browser does not support notifications.');
  } else {
    // check if permission is already granted
    if (Notification.permission === 'granted') {
      // show notification here
      var notify = new Notification(title, option);
    } else {
      // request permission from user
      toastr.success(title + (option ? '<br/>' + option?.body : ''));
      Notification.requestPermission().then(function (p) {
        if (p === 'granted') {
          // show notification here
          var notify = new Notification(title, option);
          return;
        } else {
          toastr.warning('User blocked notifications. allow please and you get the NEED MESSAGES!');
        }
      }).catch(function (err) {
        toastr.error('Notification error.');
        console.error(err);
      });
    }
  }
}

function enterLoadState() {
  $('#game_hash_input').parent().addClass('is-loading');
  $('#game_salt_input').parent().addClass('is-loading');
  $('#game_verify_submit, #chart_plus_1_submit, #chart_plus_10_submit, #chart_plus_100_submit').addClass('is-loading');
  $('#chart_minus_1_submit, #chart_minus_10_submit, #chart_minus_100_submit').addClass('is-loading');
  $('#game_hash_input, #game_salt_input, #game_amount_input, #game_verify_submit').attr('disabled', 'disabled');
  $('#game_verify_table').html('');
  isVerifying = true;
}
function exitLoadState() {
  $('#game_hash_input').parent().removeClass('is-loading');
  $('#game_salt_input').parent().removeClass('is-loading');
  $('#game_verify_submit, #chart_plus_1_submit, #chart_plus_10_submit, #chart_plus_100_submit').removeClass('is-loading');
  $('#chart_minus_1_submit, #chart_minus_10_submit, #chart_minus_100_submit').removeClass('is-loading');
  $('#game_hash_input, #game_salt_input, #game_amount_input, #game_verify_submit').removeAttr('disabled');
  isVerifying = false;
}

var $range = $('.range-analysis');

var isVerifying = false;
var data = [];
var dataN = [];
var dataN1 = [];
var gameRedThresold = 2.0;
var gameRedThresold1 = 10.0;
var duration = 0;

$('#game_verify_submit').on('click', () => {
  const gameHash = $('#game_hash_input').val();
  const gameAmount = Math.max(10, Number($('#game_amount_input').val()));
  verify(gameHash, gameAmount);
});

function showAnalysis() {
  gameRedThresold = Number($('#game_red_thresold_input').val());
  gameRedThresold1 = Number($('#game_red_thresold_input_1').val());
  analysisArray = ($('#game_analysis_input').val()).split(/\s*\,\s*/).sort((a, b) => {
    return b - a;
  });
  analysisRanges = ($('#game_analysis_range_input').val()).split(/\s*\,\s*/);
  [analPayout, analCount] = ($('#game_analysis_payout_appear_indexes').val()).split(/\s*\,\s*/);

  $range.empty();
  analysisArray.forEach((v) => showRangeAnalysis(data, v));

  const dataA = [];
  let idx = data.length - 1;
  if (!analPayout) {
    analPayout = 10;
  }
  if (!analCount) {
    analCount = 220;
  }
  let cnt = 0;
  let last = -1;
  for (let i = 0; i < Number(analCount) && i < data.length; i++, idx--) {
    if (data[idx].bust >= Number(analPayout)) {
      if (dataA[cnt] == undefined) {
        dataA[cnt] = 1;
      } else {
        dataA[cnt]++;
      }
      if (last < 0) {
        last = cnt;
      }
      cnt = 0;
    } else {
      cnt++;
    }
  }
  let str = `${analPayout} (cur: <span style="color:green;">${last}</span>): `;
  dataA.forEach((e, ix) => str += `<span style="color:red;${ix == last ? "background:yellow" : ""}">${ix}</span> : <span style="color:cyan;">${e}</span>,  `);
  $('.payout-appears').html(str);

  showSequenceRed();
  drawChart();
  drawChart1();
  scrollEnd();
}

$('#game_analysis_submit').on('click', () => {
  showAnalysis();
});

function verify(gameHash, gameAmount) {
  if (isVerifying) return;
  enterLoadState();
  localStorage.setItem('bc.game.crash.analysis.hashvalue', $('#game_hash_input').val());
  localStorage.setItem('bc.game.crash.analysis.gameamount', $('#game_amount_input').val());
  localStorage.setItem('bc.game.crash.analysis.red', $('#game_red_thresold_input').val());
  localStorage.setItem('bc.game.crash.analysis.red1', $('#game_red_thresold_input_1').val());
  localStorage.setItem('bc.game.crash.analysis.high', $('#game_high_input').val());
  localStorage.setItem('bc.game.crash.analysis.low', $('#game_low_input').val());
  localStorage.setItem('bc.game.crash.analysis.tablerows', $('#game_table_rows_input').val());
  localStorage.setItem('bc.game.crash.analysis.chartsize', $('#game_chart_size_input').val());
  localStorage.setItem('bc.game.crash.analysis.array', $('#game_analysis_input').val());
  localStorage.setItem('bc.game.crash.analysis.range', $('#game_analysis_range_input').val());
  localStorage.setItem('bc.game.crash.dotmap.height', $('#game_dotmap_height_input').val());
  $range.empty();
  duration = 0;

  data = [];
  dataN = [];
  dataN1 = [];
  let index = 0;
  let lastState = 0;
  let peCount = 0;
  let lastState1 = 0;
  let peCount1 = 0;
  const trows = Number($('#game_table_rows_input').val());
  maxDataN = 0;
  minDataN = 9999;
  for (let item of gameResults(gameHash, gameAmount)) {
    if (index < trows) {
      setTimeout(addTableRow.bind(null, item.hash, item.bust, data.length), data.length * 1);
    }

    data.unshift({ ...item, index: ++index });
    duration += item.duration;

    let curState = item.bust >= gameRedThresold ? 1 : -1;
    if (curState != lastState) {
      dataN.unshift({ state: lastState, count: peCount, time: item.time });
      peCount = 0;
    }
    peCount += curState;
    lastState = curState;

    curState = item.bust >= gameRedThresold1 ? 1 : -1;
    if (curState != lastState1) {
      dataN1.unshift({ state: lastState1, count: peCount1, time: item.time });
      if (maxDataN < peCount1) {
        maxDataN = peCount1;
      }
      if (minDataN > peCount1) {
        minDataN = peCount1;
      }
      peCount1 = 0;
    }
    peCount1 += curState;
    lastState1 = curState;
  }

  // Range Analysis
  showAnalysis();

}

function showRangeAnalysis(data, bust, index) {
  var aboveItems = data.filter((v) => v.bust >= bust);

  var delta = 0,
    totalDelta = 0,
    minDelta = 99999,
    avgDelta = 0,
    maxDelta = 0;
  var aboveRounds = '';

  var lastIndex = 0;
  aboveItems.reverse().forEach((item) => {
    aboveRounds && (aboveRounds += ', ');
    aboveRounds += `x${item.bust}/${item.index}`;

    if (lastIndex > 0) {
      delta = item.index - lastIndex;

      if (delta < minDelta) {
        minDelta = delta;
      }

      if (delta > maxDelta) {
        maxDelta = delta;
      }

      totalDelta += delta;
    }

    lastIndex = item.index;
  });
  avgDelta = totalDelta / (aboveItems.length - 1);

  if (!aboveItems.length) {
    minDelta = avgDelta = maxDelta = 0;
  }

  if (aboveItems.length === 1) {
    minDelta = avgDelta = maxDelta = aboveItems[0].index;
  }

  let $div = $('<div>').css('margin-bottom', 10);
  let $label = $('<label>').text(`Above x${bust} : ${aboveItems.length}`).css('font-weight', 'bold').css('color', 'black');
  $div.append($label.css('display', 'block'));

  let count = 0;
  let cidx = 0;
  let firstDistance = data.length;
  let i = data.length - 1 - (index ?? 0);
  let aR = 0;
  for (let num in analysisRanges) {
    aR = Number((analysisRanges[num] * bust / .99).toFixed(2));
    if (aR > data.length) {
      break;
    }
    for (; cidx < aR && i >= 0; i--, cidx++) {
      if (data[i].bust >= bust) {
        count++;
        if (count == 1) {
          firstDistance = cidx;
        }
      }
    }
    const p = Number((count / aR * 100).toFixed(2));
    const more = Number((count - Math.round(aR / bust)).toFixed(2));
    let $lbl = $('<label>').text(`IN ${aR} : ${count}(${p}%), ${more}`).css('color', more > 0 ? 'red' : more == 0 ? '#f6c722' : 'green');
    $div.append($lbl.css('display', 'block').css('font-weight', 'bold'));
  }
  let $lbl = $('<label>').text(`LATEST ${bust}X : ${firstDistance}`).css('color', firstDistance < bust ? 'red' : firstDistance == bust ? '#f6c722' : 'green');
  $div.append($lbl.css('display', 'block').css('font-weight', 'bold'));

  let $label2 = $('<label>').text(subString(aboveRounds, 45));
  let $label3 = $('<label>')
    .text(`Distance - min: ${minDelta}, avg: ${avgDelta.toFixed(3)}, max: ${maxDelta}`)
    .css('font-weight', '500');

  [$label2, $label3].forEach((el) => $div.append(el.css('display', 'block')));
  $range.append($div);
}

function subString(text, limitLength) {
  if (text.length > limitLength) {
    return text.substring(0, limitLength) + '...';
  } else {
    return text;
  }
}

function gameResultsAdd(data, amount) {
  var index = data[0].index;
  var hash = CryptoJS.SHA256(data[0].hash);

  for (let item of gameResults(hash, amount)) {
    setTimeout(addTableRow.bind(null, item.hash, item.bust, data.length), data.length * 1);
    data.unshift({ ...item, index: ++index });
    duration += Math.log(item.bust || 1) / 0.00006 + 12000;
  }

  // Range Analysis
  $range.empty();
  analysisArray.forEach((v) => showRangeAnalysis(data, v));

  showSequenceRed();
  drawChart();
  drawChart1();
}

function gameResultsSub(data, amount) {
  for (let i = 0; i < amount && data.length; i++) {
    const item = data.shift();
    duration -= Math.log(item.bust || 1) / 0.00006 + 12000;
  }

  // Range Analysis
  $range.empty();
  analysisArray.forEach((v) => showRangeAnalysis(data, v));

  showSequenceRed();
  drawChart();
  drawChart1();
}

function showSequenceRed() {
  let seq_red_count = 0;
  let max_seq_red_count = 0;
  let total_red_count = 0;

  data.forEach(d => {
    if (d.bust < gameRedThresold) {
      seq_red_count++;
    } else {
      max_seq_red_count = Math.max(seq_red_count, max_seq_red_count);
      total_red_count += seq_red_count;
      seq_red_count = 0;
    }
  });

  let seq_one_count = 0;
  let max_seq_one_count = 0;
  let seq2_one_count = 0;
  let max2_seq_one_count = 0;
  let seq1_one_count = 0;
  let max1_seq_one_count = 0;

  dataN.forEach(d => {
    if (Math.abs(d.count) <= 2) {
      seq_one_count++;
    } else {
      max_seq_one_count = Math.max(seq_one_count, max_seq_one_count);
      seq_one_count = 0;
    }
    if (d.count > 0) {
      if (d.count == 2) {
        seq2_one_count++;
      } else if (d.count > 4) {
        max2_seq_one_count = Math.max(seq2_one_count, max2_seq_one_count);
        seq2_one_count = 0;
      }
    } else {
      if (d.count == -1) {
        seq1_one_count++;
      } else {
        max1_seq_one_count = Math.max(seq1_one_count, max1_seq_one_count);
        seq1_one_count = 0;
      }
    }
  });

  $('#game_max_red_sequence_count_in_table').text(`${max_seq_red_count} (${max_seq_one_count}, ${max2_seq_one_count}, ${max1_seq_one_count})`);
  $('#game_max_red_sequence_count_in_chart').text(`${max_seq_red_count} (${max_seq_one_count}, ${max2_seq_one_count}, ${max1_seq_one_count})`);

  var total_blue_count = data.length - total_red_count;
  var house_edge = (total_blue_count - total_red_count) * 100 / data.length;
  $('#game_info').text(`Total Duration: ${msToTime(duration)}, Blue: ${total_blue_count}, Red: ${total_red_count}, Sub: ${total_blue_count - total_red_count}, House Edge: ${house_edge.toFixed(2)}%`);
}

$('#chart_plus_1_submit').on('click', () => {
  $('#game_amount_input').val(Number($('#game_amount_input').val()) + 1);
  $('#game_verify_submit').click();
  return;
  let $amountInput = $('#game_amount_input');
  gameResultsAdd(data, 1);
  $amountInput.val(data.length);
});
$('#chart_plus_10_submit').on('click', () => {
  $('#game_amount_input').val(Number($('#game_amount_input').val()) + 10);
  $('#game_verify_submit').click();
  return;
  let $amountInput = $('#game_amount_input');
  gameResultsAdd(data, 10);
  $amountInput.val(data.length);
});
$('#chart_plus_100_submit').on('click', () => {
  $('#game_amount_input').val(Number($('#game_amount_input').val()) + 100);
  $('#game_verify_submit').click();
  return;
  let $amountInput = $('#game_amount_input');
  gameResultsAdd(data, 100);
  $amountInput.val(data.length);
});
$('#chart_minus_1_submit').on('click', () => {
  $('#game_amount_input').val(Math.max(10, Number($('#game_amount_input').val()) - 1));
  $('#game_verify_submit').click();
  return;
  let $amountInput = $('#game_amount_input');
  gameResultsSub(data, 1);
  $amountInput.val(data.length);
});
$('#chart_minus_10_submit').on('click', () => {
  $('#game_amount_input').val(Math.max(10, Number($('#game_amount_input').val()) - 10));
  $('#game_verify_submit').click();
  return;
  let $amountInput = $('#game_amount_input');
  gameResultsSub(data, 10);
  $amountInput.val(data.length);
});
$('#chart_minus_100_submit').on('click', () => {
  $('#game_amount_input').val(Math.max(10, Number($('#game_amount_input').val()) - 100));
  $('#game_verify_submit').click();
  return;
  let $amountInput = $('#game_amount_input');
  gameResultsSub(data, 100);
  $amountInput.val(data.length);
});
$('#chart_reset_submit').on('click', () => {
  $('#game_amount_input').val(100);
  $('#game_verify_submit').click();
});

// $('#game_amount_input').on('keyup', () => {
//   if ($('#game_amount_input').val() >= 10000) {
//     if ($('#game_verify_warning').length) return;
//     $('#game_verify_submit')
//       .parent()
//       .append(
//         $('<span/>')
//           .attr({
//             id: 'game_verify_warning',
//             class: 'tag is-warning',
//           })
//           .text('Verifying a huge amount of games may consume more ressources from your CPU')
//       );
//   } else {
//     if ($('#game_verify_warning').length) {
//       $('#game_verify_warning').remove();
//     }
//   }
// });

const addTableRow = (hash, bust, index) => {
  $('<tr/>')
    .attr({
      class: index === 0 ? 'is-first' : null,
    })
    .append($('<td/>').text(hash))
    .append(
      $('<td/>')
        .text(bust)
        .attr({
          class: bust >= gameRedThresold ? 'is-over-median' : 'is-under-median',
        })
    )
    .appendToWithIndex($('#game_verify_table'), index);

  if (index >= $('#game_table_rows_input').val() - 1) {
    exitLoadState();
  }
};
$.fn.appendToWithIndex = function (to, index) {
  if (!(to instanceof jQuery)) {
    to = $(to);
  }
  if (index === 0) {
    $(this).prependTo(to);
  } else {
    $(this).insertAfter(to.children().eq(index - 1));
  }
};

function prob(multiplier) {
  if (Array.isArray(multiplier)) {
    return multiplier.reduce((accumulator, item) => {
      return accumulator * prob(item);
    }, 1);
  } else if (!isNaN(multiplier)) {
    return 0.99 / multiplier;
  } else {
    throw new Error(`multiplier must be a number or array instead of '${typeof multiplier}'.`);
  }
}
prob.invert = function (probability) {
  if (Array.isArray(probability)) {
    let result = [];
    if (probability.length > 0) result[0] = prob.invert(probability[0]);
    for (let i = 1; i < probability.length; i++) {
      result.push(prob.invert(probability[i] / probability[i - 1]));
      if (result[result.length - 1] < 1.01) {
        throw new Error(`probability[${i}] is impossible.`);
      }
    }
    return result;
  } else if (!isNaN(probability)) {
    return 0.99 / probability;
  } else {
    throw new Error(`probability must be a number or array instead of '${typeof probability}'.`);
  }
};

function* gameResults(gameHash, gameAmount) {
  let salt = $('#game_salt_input').val();
  let prevHash = null;
  let now = new Date().getTime();
  let all_duration = 0;
  for (let index = 0; index < gameAmount; index++) {
    let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : gameHash);
    let bust = salt.startsWith('0x') ? gameResultForEthercrash(hash, salt) : gameResult(hash, salt);
    let duration = Math.log(bust || 1) / 0.00006 + 12000;
    all_duration += duration;
    let time_ms = now - all_duration;
    let time = new Date(time_ms);
    yield { hash, bust, duration, time };

    prevHash = hash;
  }
}

function divisible(hash, mod) {
  // So ABCDEFGHIJ should be chunked like  AB CDEF GHIJ
  var val = 0;

  var o = hash.length % 4;
  for (var i = o > 0 ? o - 4 : 0; i < hash.length; i += 4) {
    val = ((val << 16) + parseInt(hash.substring(i, i + 4), 16)) % mod;
  }

  return val === 0;
}

function hmac(key, v) {
  var hmacHasher = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, key);
  return hmacHasher.finalize(v).toString();
}

function gameResultForEthercrash(serverSeed, salt) {
  // see: provably fair seeding event https://bitcointalk.org/index.php?topic=4959619
  //Block 6217364 0xd8b8a187d5865a733680b4bf4d612afec9c6829285d77f438cd70695fb946801
  var hash = hmac(serverSeed, salt);

  // In 1 of 101 games the game crashes instantly.
  if (divisible(hash, 101)) return 0;

  // Use the most significant 52-bit from the hash to calculate the crash point
  var h = parseInt(hash.slice(0, 52 / 4), 16);
  var e = Math.pow(2, 52);

  return (Math.floor((100 * e - h) / (e - h)) / 100).toFixed(2);
}

function gameResult(seed, salt) {
  const nBits = 52; // number of most significant bits to use

  // 1. HMAC_SHA256(message=seed, key=salt)
  const hmac = CryptoJS.HmacSHA256(CryptoJS.enc.Hex.parse(seed), salt);
  seed = hmac.toString(CryptoJS.enc.Hex);

  // 2. r = 52 most significant bits
  seed = seed.slice(0, nBits / 4);
  const r = parseInt(seed, 16);

  // 3. X = r / 2^52
  let X = r / Math.pow(2, nBits); // uniformly distributed in [0; 1)

  // 4. X = 99 / (1-X)
  X = 99 / (1 - X);

  // 5. return max(trunc(X), 100)
  const result = Math.floor(X);
  return Math.max(1, result / 100);
}

var mychart = null;
var mychart1 = null;

function drawChart() {
  const ctx1 = document.getElementById('chartjs_container');
  width = $(ctx1).parent().width();
  $(ctx1).replaceWith(`<canvas id="chartjs_container" width="${width}" height="200"></canvas>`);
  const ctx = document.getElementById('chartjs_container');
  const type = $('#game_chart_type_input').val();

  let datalength = data.length;
  const chartData = {
    labels: data.map((d, i) => `${d.time.toLocaleTimeString()}\n(${datalength - i})`),
    datasets: [
      {
        label: '',
        data: data.map((d) => d.bust),
        backgroundColor: (ctx) => {
          if (ctx.raw < gameRedThresold) {
            return 'red';
          } else if (ctx.raw >= 100) {
            return 'yellow';  // dark yellow
          } else if (ctx.raw >= 40) {
            return '#f0f000';  // dark yellow
          } else if (ctx.raw >= 10) {
            return '#e0e000';
          }

          return 'green';
        },
      },
    ],
  };

  const config = {
    type: type,
    data: chartData,
    options: {
      responsive: false,
      scales: {
        x: {
          grid: {
            offset: false,
          },
          ticks: {
            autoSkip: data.length > 50 ? true : false,
          },
          // reverse: true,
        },
        y: {
          beginAtZero: true,
          max: Math.max(1.01, $('#game_high_input').val()),
          min: Math.max(0, $('#game_low_input').val()),
          ticks: {
            callback: function (value, index, ticks) {
              return value + ' x';
            },
          },
          position: 'right',
        },
      },
      chartArea: {
        backgroundColor: 'black',
      },
      plugins: {
        legend: {
          display: false,
        },
      },
      animations: {},
      animation: false,
    },
  };

  if (mychart) {
    mychart.destroy();
  }

  Chart.defaults.backgroundColor = 'red';
  Chart.defaults.titleColor = 'red';
  Chart.defaults.bodyColor = 'black';
  Chart.defaults.multiKeyBackground = 'red';
  // Chart.defaults.borderColor = '#aaa';
  // Chart.defaults.fill = 1;
  // Chart.defaults.showLine = !1;

  // Chart.defaults.borderColor = '#36A2EB';
  Chart.defaults.color = '#000';
  mychart = new Chart(ctx, config);
}

function drawChart2() {
  const ctx1 = document.getElementById('chartjs_container1');
  width = $(ctx1).parent().width();
  $(ctx1).replaceWith(`<canvas id="chartjs_container1" width="${width}" height="150"></canvas>`);
  const ctx = document.getElementById('chartjs_container1');
  const chartData = {
    // labels: dataN.map((d) => ''),
    labels: dataN1.map((d) => Math.abs(d.count)),
    // labels: dataN.map((d) => d.time.toLocaleTimeString()),
    datasets: [
      {
        label: '',
        data: dataN1.map((d) => d.count),
        backgroundColor: (ctx) => {
          // if(ctx.raw < -30) {
          //   return 'yellow'
          // }
          if (ctx.raw < 0) {
            return 'red';
          }
          return 'green';
        },
        borderColor: (ctx) => {
          if(ctx.raw < -30) {
            return 'yellow'
          }
        }
      },
    ],
  };

  const config = {
    type: 'bar',
    data: chartData,
    options: {
      responsive: false,
      scales: {
        x: {
          grid: {
            offset: false,
          },
          ticks: {
            // callback: function (value, index, ticks) {
            //   return Math.abs(value);
            // },
            autoSkip: dataN.length > 50 ? true : false,
          },
        },
        y: {
          beginAtZero: true,
          max: maxDataN,
          min: -30,
          ticks: {
            callback: function (value, index, ticks) {
              return Math.abs(value);
            },
          },
          position: 'right',
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        customCanvasBackgroundColor: {
          color: 'lightGreen',
        }
      },
      animations: {},
      animation: false,
    },
  };

  if (mychart1) {
    mychart1.destroy();
  }

  mychart1 = new Chart(ctx, config);
}

function drawChartM() {
  let show = document.getElementById("game_analysis_graph").checked;
  let ctx = document.getElementById("chartjs_container_m").getContext('2d');
  document.getElementById("chartjs_container_m").style.display = show ? 'block' : 'none';
  if (!show) {
    return;
  }
  const option = {
    type: 'line',
    data: {
      datasets: []
    },
    options: {
      responsive: true, // Instruct chart js to respond nicely.
      maintainAspectRatio: false, // Add to prevent default behaviour of full-width/height 
    }
  }
  option.data.labels = data.map(e => e.bust);
  const borderColor = ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6',
    '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
    '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A',
    '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
    '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC',
    '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
    '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680',
    '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
    '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3',
    '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];
  const backgroundColor = ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6',
    '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
    '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A',
    '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
    '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC',
    '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
    '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680',
    '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
    '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3',
    '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];
  let gMax = Math.max(analysisArray.length, 10);
  for (let i = 0, j = 0; i < analysisArray.length; i++, j += .3) {
    option.data.datasets.push({
      label: `${analysisArray[i]}`,
      data: data.map(e => (e.bust >= analysisArray[i] ? (gMax - j) + gMax : -(gMax - j) + gMax)),
      fill: true,
      borderColor: borderColor[i],
      backgroundColor: backgroundColor[i] + '30',
      borderWidth: 1,
    });
  }
  let myChart = new MChart(ctx, option);
}

function initHistory() {
  $('.cell-dot').removeClass('type-1').removeClass('type-2').removeClass('type-3');
  $('.cell-dot').addClass('type-0');
  $('.cell-dot').removeAttr('title');
  $('.cell-dot').removeAttr('index');
  $('.cell-value').removeClass('type-1').removeClass('type-2').removeClass('type-3').removeClass('type-H').removeClass('type-Z');
  $('.cell-value').removeAttr('title').html('');
}

function addHistory(col, row, val, idx, time) {
  let items = $('.cell-dot');
  let classItem = 'type-0';
  if (val < gameRedThresold) {
    classItem = 'type-1';
  } else if (val < 10) {
    classItem = 'type-2';
  } else {
    classItem = 'type-3';
  }
  let x = col;
  let y = 0;
  let maxY = load_game_dotmap_height_input - 1;
  for (let i = 0; i < load_game_dotmap_height_input; i++) {
    let curItem = items[dots_cols * i + x];
    if ($(curItem).hasClass('type-0')) {
      maxY = i;
    } else if (($(curItem).hasClass('type-1') && classItem == 'type-1') ||
      (!$(curItem).hasClass('type-1') && classItem != 'type-1')) {
      break;
    } else {
      maxY = i;
    }
  }
  if (row <= maxY) {
    y = row;
  } else {
    y = maxY;
    x = Math.max(0, col - (row - y));
  }
  $(items[dots_cols * y + x]).removeClass('type-0').addClass(classItem);
  $(items[dots_cols * y + x]).attr('title', `${val}\n${idx + 1}\n${time}`);
  $(items[dots_cols * y + x]).attr('index', idx);
}

function drawChart1() {
  drawChart2();
  drawChartM();
  initHistory();

  let resize_require = load_game_dotmap_height_input != $('#game_dotmap_height_input').val();
  load_game_dotmap_height_input = $('#game_dotmap_height_input').val();
  if (resize_require) {
    initDots();
  }

  let index = dataN.length - 1;
  let didx = data.length - 1;
  const vitems = $('.cell-value');
  let vitemIdx = 0;
  let ditemIdx = 0;
  let vidx = vitems.length - 1;
  for (let idx = ($('.cell-dot')).length / load_game_dotmap_height_input - 1; index >= 0 && idx >= 0; idx--, index--) {
    const len = Math.abs(dataN[index].count);
    const items = [];
    for (let i = 0; i < len; i++, didx--, vidx--, vitemIdx++) {
      items.unshift(data[didx]);
      if (vidx >= 0) {
        let classItem = '';
        if (data[didx].bust < 1.5) {
          classItem = 'type-Z';
        } else if (data[didx].bust < gameRedThresold) {
          classItem = 'type-1';
        } else if (data[didx].bust < 10) {
          classItem = 'type-2';
        } else if (data[didx].bust < 100) {
          classItem = 'type-3';
        } else {
          classItem = 'type-H';
        }
        $(vitems[vidx]).html(data[didx].bust);
        $(vitems[vidx]).addClass(classItem);
        $(vitems[vidx]).attr('index', vitemIdx);
        $(vitems[vidx]).attr('title', `${vitemIdx + 1}\n${data[didx].time.toLocaleTimeString()}`);
      }
    }
    let didx1 = ditemIdx + len - 1;
    for (let i = 0; i < len; i++, didx1--) {
      addHistory(idx, i, items[i].bust, didx1, items[i].time.toLocaleTimeString());
    }
    ditemIdx += len;
  }

  exitLoadState();
}


// Salt change
$('#bustabit_salt_button').on('click', () => {
  $('#game_salt_input').val('0000000000000000004d6ec16dafe9d8370958664c1dc422f452892264c59526');
});

$('#ethercrash_salt_button').on('click', () => {
  $('#game_salt_input').val('0xd8b8a187d5865a733680b4bf4d612afec9c6829285d77f438cd70695fb946801');
});

$('#bcgame_salt_button').on('click', () => {
  $('#game_salt_input').val('0000000000000000000301e2801a9a9598bfb114e574a91a887f2132f33047e6');
});

function msToTime(duration) {
  let seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24),
    days = Math.floor(duration / (1000 * 60 * 60 * 24));

  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return (days > 0 ? days + "d " : "") + hours + "h " + minutes + "m " + seconds + "s";
}

var getUrlParameter = function getUrlParameter(sParam) {
  var sPageURL = window.location.search.substring(1),
    sURLVariables = sPageURL.split('&'),
    sParameterName,
    i;

  for (i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split('=');

    if (sParameterName[0] === sParam) {
      return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
    }
  }
  return false;
};

$(function () {
  var game = getUrlParameter('game');
  if (game === 'ethercrash') {
    $('#game_salt_input').val('0xd8b8a187d5865a733680b4bf4d612afec9c6829285d77f438cd70695fb946801');
  } else if (game === 'bustabit') {
    $('#game_salt_input').val('0000000000000000004d6ec16dafe9d8370958664c1dc422f452892264c59526');
  }

  userId = getUrlParameter('userid');
  if (userId) {
    $('#ethercrash_user_rounds').attr('src', `https://www.ethercrash.io/user/${userId}`);
    $('#user_rounds_tab').removeClass('is-hidden');
  }
});

// toggle theme
$('#toggle_theme_button').on('click', () => {
  const isDarkMode = $('body').hasClass('dark');
  if (isDarkMode) {
    $('body').removeClass('dark');
  } else {
    $('body').addClass('dark');
  }
});

function websiteVisits(response) {
  document.querySelector("#visits").textContent = response.value;
}

async function refreshAll() {
  const url = `/get/hash`
  // const url = `http://icanhazip.com`
  fetch(url)
    .then((data) => {
      data.text().then((hash) => {
        // if (gHash == hash) {
        // } else {
        if (hash) {
          gHash = hash;
          $('#game_hash_input').val(gHash);
        }
        $('#game_verify_submit').click();
        // }
        // setTimeout(refreshAll, 2000);
      })
    })
    .catch((error) => {
      console.log(error);
    })
}

function scrollEnd() {
  let element = document.querySelector('#dots-wrap');
  element.scrollLeft = element.scrollWidth;
}

window.addEventListener('resize', function (event) {
  initDots();

  drawChart();
  drawChart1();
  scrollEnd();
}, true);


// $('#game_verify_submit').click();
refreshAll();
scrollEnd();

// console.log($('.cell-dot').length);

document.onreadystatechange = function () {
  if (document.readyState == "complete") {
    initDots();
    console.log($(window).height(), $(window).width());
  } else if (document.readyState == "interactive") {
  }
};
