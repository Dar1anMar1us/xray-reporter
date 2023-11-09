// ............................................................................
// IMPORTS
// ............................................................................
const fetch = require('node-fetch');
const base64 = require('nodejs-base64');
const fs = require('fs');
const https = require('https');
const agent = new https.Agent({ rejectUnauthorized: false, keepAlive: true })

// ............................................................................
// MEMBERS
// ............................................................................
let headers = xrayHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};
let baseUrl = 'https://axinic.central.inditex.grp/jira';
let xrayVersion = '2.0';

// ............................................................................
// METHODS
// ............................................................................
/**
 * Specified the Jira installation Url (base url) to use in
 * api communication.
 * @param {uri} jiraUrl 
 */
function setJiraUrl(jiraUrl) {
    // validate url ?
    baseUrl = jiraUrl;
}

/**
 * Auth based on the Karate environment used 
 * @param {string} username 
 * @param {string} password 
 * @param {string} jiraToken
 * @param {string} xrayToken
 */
function setExtendedAuth(username, password, jiraToken, xrayToken) {
  try {
    headers = createImportHeader(username, password, jiraToken);
    xrayHeaders = createImportHeader(username, password, xrayToken);
    xrayVersion = '1.0';
  console.log('Jira external headers have been set');
  } catch (err) {
    console.log(err.message)
    throw err.message;
  }
}

/**
 * Configure headers for jira api communication including
 * authorization with username and password.
 * @param {string} username 
 * @param {string} password 
 * @returns true if configured, false otherwise
 */
function setAuthentication(username, password) {
    try {
        headers['Authorization'] = `Basic ${base64.base64encode(`${username}:${password}`)}`;
        xrayHeaders['Authorization'] = `Basic ${base64.base64encode(`${username}:${password}`)}`;
    console.log('Jira internal headers have been set');
  } catch (err) {
    throw err.message;
  }
}

function createAuthHeader(username, password) {
  const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
  return {
    'Authorization': authHeader
  };
}

function createImportHeader(username, password, token) {
  const authHeader = createAuthHeader(username, password);
  return {
    ...authHeader,
    'itx-apikey': token,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
}

/**
 * Check api response. Throws an error if failed.
 * @param {*} response 
 * @returns the response object
 */
async function checkResponse(response) {
  if (!response.ok) {
    let body = await response.text();
    let message = `Error response received:\nStatus: ${response.status}\nBody: ${body}`;
    throw new Error(message);
  }
  return response;
}

/**
 * Get the issue type for the given testPlan
 * @param {*} testPlan 
 * @returns 
 */
async function getIssueType(testPlan) {
  let issueType = undefined;
  const issueEndpoint = '/rest/api/2/issue/';
  const issueUlr = baseUrl + issueEndpoint + testPlan;
  console.log(`Issue url is: ${issueUlr}`);

  issueType = await fetch(issueUlr, {
    method: 'GET',
    agent: agent,
    headers: headers
  })
    .then(response => checkResponse(response))
    .then(response => response.json())
    .then(body => { return body.fields.issuetype.name })
    .catch(error => console.log(error));

  return issueType;
}

/**
 * Import cucumber report to jira
 * @param {*} reportFile 
 * @returns 
 */
async function importCucumberReport(reportFile) {
  let issueKey = undefined;
  const importEndpoint = `/rest/raven/${xrayVersion}/import/execution/cucumber`;
  const importUrl = baseUrl + importEndpoint;
  console.log(`Import url is: ${importUrl}`);

  let reportFileData = fs.readFileSync(reportFile);

  issueKey = await fetch(importUrl, {
    method: 'POST',
    agent: agent,
    headers: xrayHeaders,
    body: reportFileData
  })
    .then(response => checkResponse(response))
    .then(response => response.json())
    .then(body => { return body.testExecIssue.key })
    .catch(error => console.log(error));

  return issueKey;
}

/**
 * Add TestExecution to TestPlan
 * @param {*} testPlanKey 
 * @param {*} testExecutionKey 
 * @returns 
 */
async function addTexecToTestplan(testPlanKey, testExecutionKey) {
  let added = false;
  const testPlanExecutionsEndpoint = `/rest/raven/${xrayVersion}/api/testplan/${testPlanKey}/testexecution`;
  const testPlanExecutionsUrl = baseUrl + testPlanExecutionsEndpoint;

  console.log(`Add test execution URL:  ${testPlanExecutionsUrl}`);

  added = await fetch(testPlanExecutionsUrl, {
    method: 'POST',
    agent: agent,
    headers: xrayHeaders,
    body: `{ "add": ["${testExecutionKey}"] }`
  })
    .then(response => checkResponse(response))
    .then(() => true)
    .catch(error => console.log(error));

  return added;
}

/**
 * Rename issue
 * @param {string} issueKey 
 * @param {string} summary 
 * @returns 
 */
async function changeIssueSummary(issueKey, summary) {
  let changed = false;
  const issueEndpoint = `/rest/api/2/issue/${issueKey}`;
  const issueUrl = baseUrl + issueEndpoint;

  changed = await fetch(issueUrl, {
    method: 'PUT',
    agent: agent,
    headers: headers,
    body: `{ "fields": {"summary": "${summary}"} }`
  })
    .then(response => checkResponse(response))
    .then(() => true)
    .catch(error => console.log(error));

  return changed;
}

/**
 * Rename issue
 * @param {string} issueKey 
 * @param {string} description 
 * @returns 
 */
async function changeIssueDescription(issueKey, description) {
  let changed = false;
  const issueEndpoint = `/rest/api/2/issue/${issueKey}`;
  const issueUrl = baseUrl + issueEndpoint;

  changed = await fetch(issueUrl, {
    method: 'PUT',
    agent: agent,
    headers: headers,
    body: `{ "fields": {"description": "${description}"} }`
  })
    .then(response => checkResponse(response))
    .then(() => true)
    .catch(error => console.log(error));

  return changed;
}

/**
 * Change JIRA issue assignee person
 * @param {*} issueKey JIRA Issue identifier
 * @param {*} assignee JIRA User identifier
 * @returns 
 */
async function changeIssueAssignee(issueKey, newAssignee) {
  let changed = false;
  const issueEndpoint = `/rest/api/2/issue/${issueKey}`;
  const issueUrl = baseUrl + issueEndpoint;
  const bodyRequest = {
    fields: {
      assignee: {
        name: newAssignee
      }
    }
  };

  changed = await fetch(issueUrl, {
    method: 'PUT',
    agent: agent,
    headers: headers,
    body: JSON.stringify(bodyRequest)
  })
    .then(response => checkResponse(response))
    .then(() => true)
    .catch(error => console.log(error));

  return changed;
}

/**
 * Update Test Environments custom field
 * @param {string} issueKey 
 * @param {array} testEnvironments 
 * @returns 
 */
async function updateTestEnvironments(issueKey, testEnvironments) {
  let changed = false;
  const issueEndpoint = `/rest/api/2/issue/${issueKey}`;
  const issueUrl = baseUrl + issueEndpoint;
  const bodyRequest = {
                        fields: {
                          customfield_15567: testEnvironments
                        }
                      };
  changed = await fetch(issueUrl, {
    method: 'PUT',
    agent: agent,
    headers: headers,
    body: JSON.stringify(bodyRequest)
  })
    .then(response => checkResponse(response))
    .then(() => true)
    .catch(error => console.log(error));

  return changed;
}

/**
 * Update Affected Versions custom field
 * @param {string} issueKey 
 * @param {array} affectedVersions
 * @returns 
 */
async function updateAffectedVersions(issueKey, affectedVersions) {
  let changed = false;
  const issueEndpoint = `/rest/api/2/issue/${issueKey}`;
  const issueUrl = baseUrl + issueEndpoint;
  // versions fields it's in the form of
  // [ { 'name': 'thename' }, { 'name': 'thename'} ]
  let affectdVersionsAsObject = []
  affectedVersions.forEach( e => { affectdVersionsAsObject.push( { name: e } ); });
  const bodyRequest = {
                        fields: {
                          versions: affectdVersionsAsObject
                        }
                      };
  changed = await fetch(issueUrl, {
    method: 'PUT',
    agent: agent,
    headers: headers,
    body: JSON.stringify(bodyRequest)
  })
    .then(response => checkResponse(response))
    .then(() => true)
    .catch(error => console.log(error));

  return changed;
}

/**
 * Update Labels field
 * @param {string} issueKey 
 * @param {array} labelList
 * @returns 
 */
async function updateLabels(issueKey, labelList) {
  let changed = false;
  const issueEndpoint = `/rest/api/2/issue/${issueKey}`;
  const issueUrl = baseUrl + issueEndpoint;
  const bodyRequest = {
                        fields: {
                          labels: labelList
                        }
                      };
  changed = await fetch(issueUrl, {
    method: 'PUT',
    agent: agent,
    headers: headers,
    body: JSON.stringify(bodyRequest)
  })
    .then(response => checkResponse(response))
    .then(() => true)
    .catch(error => console.log(error));

  return changed;
}

/**
 * Close Test Execution Issue
 * @param {string} testExecutionKey 
 * @returns 
 */
async function closeTestExecutionIssue(testExecutionKey) {
  let closed = false;
  const testPlanExecutionsEndpoint = `/rest/api/2/issue/${testExecutionKey}/transitions`;
  const testPlanExecutionsUrl = baseUrl + testPlanExecutionsEndpoint;

  closed = await fetch(testPlanExecutionsUrl, {
    method: 'POST',
    agent: agent,
    headers: headers,
    body: `{ "transition": {"id":"2"}}`
  })
    .then(response => checkResponse(response))
    .then(() => true)
    .catch(error => console.log(error));

  return closed;
}

// ............................................................................
// EXPORTS
// ............................................................................
module.exports = {
  setJiraUrl,
  setExtendedAuth,
  setAuthentication,
  getIssueType,
  importCucumberReport,
  addTexecToTestplan,
  changeIssueSummary,
  changeIssueDescription,
  updateTestEnvironments,
  updateAffectedVersions,
  closeTestExecutionIssue,
  changeIssueAssignee,
  updateLabels
};
