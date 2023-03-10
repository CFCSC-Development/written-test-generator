/* Author: Mufaro Machaya (nickelulz)
 * 
 * Description: Loader for test question data into google forms.
 * Note: This is still just a prototype. It is still in the works!
 */

// Form Configuration
const FORM_OUTPUT_ID = '1o7agNlPBrsiFjWaxz1SpUR8-jDwtlXXK'
const NUM_FORMS_CREATED = 1
const FORM_SIZE = -1 // -1 for entire question bank
const ORDER_BY_NUMBER = true
const QUESTION_COLLECTIONS = [ 'Regionals, 2007' ] // leave empty for all
const TAGS = []

// MongoDB Config
const MONGO_API_KEY = '7izUH8D4vsrlpiPwcCkpz50Mj3EmYjZULb41SOVcMJc31S6I712wORiboew7clxa'
const MONGO_API_URL = 'https://data.mongodb-api.com/app/data-lpnqf/endpoint/data/v1/action/find'

// List of collections and tags
const ALL_COMPLETE_COLLECTIONS = [
  'Districts Version 2, 2011',
  'Invitational Version B, 2010',
  'Regionals, 2007',
  'Seven Lakes, 2014',
  'State, 2007',
  'State, 2008',
  'State, 2009',
  'State, 2010'
]

const ALL_COLLECTIONS = [
  'CS08d Version 1, 2008',
  'CS08d Version 2, 2008',
  'Districts Version 1, 2007',
  'Districts Version 1, 2008',
  'Districts Version 1, 2010',
  'Districts Version 1, 2011',
  'Districts Version 2, 2007',
  'Districts Version 2, 2008',
  'Districts Version 2, 2010',
  'Districts Version 2, 2011',
  'Districts Version 2, 2012',
  'Districts, 2013',
  'Districts, 2014',
  'Global Question Pool',
  'Invitational Version A, 2007',
  'Invitational Version A, 2008',
  'Invitational Version A, 2010',
  'Invitational Version A, 2011',
  'Invitational Version B, 200',
  'Invitational Version B, 2008',
  'Invitational Version B, 2010', // complete
  'Invitational Version B, 2011',
  'Invitational Version B, 2014',
  'Practice, 2008',
  'Regionals, 2007', // complete
  'Regionals, 2008',
  'Regionals, 2009',
  'Regionals, 2010',
  'Regionals, 2012',
  'Seven Lakes, 2014',
  'State, 2007',
  'State, 2008',
  'State, 2009',
  'State, 2010',
  'University of Texas CS Invitational, 2010',
  'University of Texas CS Invitational, 2011',
  'written_test_study_packet_2014'
]

const ALL_TAGS = [
	"base math",
	"math",
	"loops",
	"boolean algebra",
	"inheritance",
	"operators",
	"class structure",
	"data structures",
	"conditionals",
	"regex",
	"strings",
	"sorts",
	"algorithms",
	"searches",
	"big o",
	"lambda expressions",
	"polish notation",
	"logic gates",
	"recursion",
	"arrays",
	"iterators",
	"arraylists",
	"maps",
	"sets",
	"linkedlists",
	"queues",
	"stacks",
  "output",
  "syntax",
  "binary search trees"
]

function main() {
  // Clear previous folder
  // var files = DriveApp.getFolderById(FORM_OUTPUT_ID).getFiles();
  // while (files.hasNext()) {
  //   files.next().setTrashed(true);
  // }

  // Loop over the files
  const question_bank = load_data(QUESTION_COLLECTIONS, TAGS)

  // Logger.log(JSON.stringify(question_bank, null, '\t'))
  
  // for (let i = 1; i <= NUM_FORMS_CREATED; i++) {
  //   // Logger.log('Generating question set #' + i + '.');
  //   // let question_set = generate_question_set(question_bank);
  //   Logger.log('Generating form #' + i + '.');
  //   // createQuestionsOnForm(question_set, `Randomized Written Test (${question_set.length}) ${i}`);
  //   createQuestionsOnForm(question_bank, 'Regionals, 2007');
  // }
  createQuestionsOnForm(question_bank, QUESTION_COLLECTIONS[0])
}

function load_data(collections, tags) {
  if (collections.length == 0)
    collections = ALL_COMPLETE_COLLECTIONS
  var question_bank = []
  collections.forEach(collection => {
    Logger.log('Loading collection: ' + collection)
    get_data_from_mongo(collection).forEach(question => question_bank.push(question))
  })
  if (tags.length == 0)
    tags = ALL_TAGS
  question_bank = question_bank.filter(question => {
    return question.tags.filter(tag => tags.includes(tag)).length > 0 && !has_remove_heuristic(question)
  })
  return question_bank
}

function get_data_from_mongo(collection) {
  const request_body = JSON.stringify({
    'dataSource': 'main',
    'database': 'question_pool',
    'collection': collection
  })


  const options = {
    'method': 'POST',
    'contentType': 'application/json',
    'contentLength': request_body.length,
    'headers': {
      'api-key': MONGO_API_KEY
    },
    'payload': request_body
  }

  const response = UrlFetchApp.fetch(MONGO_API_URL, options)
  try {
    return JSON.parse(response.getContentText()).documents
  } catch (err) {
    throw new Error('Failed MongoDB request: ' + collection)
  }
}

function generate_question_set(question_bank) {
  var question_set = new Set();

  if (FORM_SIZE >= question_bank.length || FORM_SIZE < 0) {
    question_set = new Set(question_bank)
    Logger.log(FORM_SIZE + ' out of bounds. Using entire question bank.')
  }

  else {
    while (question_set.length < FORM_SIZE) {
      var question = question_bank[ (Math.random() * question_bank.length) | 0 ];
      question_set.add(question)
    }
  }

  let out = Array.from(question_set);

  if (ORDER_BY_NUMBER) {
    Logger.log("Ordering by number...");
    out.sort((a, b) => a.questionNumber - b.questionNumber);
  }

  out.forEach(question => {
    Logger.log(question.testSource + ' - ' + question.questionNumber);
  })

  // removes any duplicates
  return out;
}

// this just filters out any questions in the question bank that are missing some data
function has_remove_heuristic(question) {
  let invalid = false;
  let reason = [];
  // No correct answer set
  if (question.correctAnswer == 'No correct answer found.') {
    invalid = true;
    reason.push('No correct answer set')
  }
  if (typeof question.answers != typeof []) {
    invalid = true;
    reason.push('Question answers is not an array: ' + typeof question.answers)
  }
  else if (question.answers.length == 0) {
    invalid = true;
    reason.push('Question answers is empty')
  }
  if (invalid) {
    Logger.log('INVALID QUESTION: ' + question.testSource + ' - ' + question.questionNumber);
    Logger.log('REASON = ' + reason.length == 1 ? reason[0] : reason.reduce((a,b) => a + ', ' + b));
  }
  return invalid;
}

function createQuestionsOnForm(questions, name) {
  // Get the form to add the questions to
  var form = FormApp.create(name) // each set will have the same test source
    .setTitle(name)
    .setIsQuiz(true)
    // .setRequireLogin(true)
    .setPublishingSummary(true)
    .setDescription('This written test practice was automatically generated. If any answers seem incorrect or anything seems out of place, please make a note of the problem number, test source and version, and notify a club officer immediately.\n\nTags: ' + TAGS.toString())

  // move to separate folder
  DriveApp.getFileById(form.getId()).moveTo(DriveApp.getFolderById(FORM_OUTPUT_ID));

  // Iterate over the array of questions
  for (var i = 0; i < questions.length; i++) {

    // Add the question to the form
    var question = form.addMultipleChoiceItem();
    question.setTitle('Source: ' + questions[i].testSource + ' - Question ' + questions[i].questionNumber + '\n\n' + questions[i].questionDescription)
    question.setPoints(1);

    // add answers
    var answers = [];
    questions[i].answers.forEach(choice => {
      var letter = choice.substring(0, 1);
      // Logger.log(choice + ' ' + letter + ': ' + questions[i].correctAnswer);
      // question.createChoice(choice, questions[i].correctAnswer == letter);
      answers.push(question.createChoice(choice, letter == questions[i].correctAnswer));
    });
    question.setChoices(answers);
  }
}
