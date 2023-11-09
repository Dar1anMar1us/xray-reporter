// https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action
// https://github.com/actions/javascript-action
// ............................................................................
// IMPORTS
// ............................................................................
import { getInput, setOutput, setFailed } from '@actions/core';
import { setJiraUrl, getIssueType, importCucumberReport, changeIssueSummary, changeIssueDescription, changeIssueAssignee, updateTestEnvironments, updateAffectedVersions, updateLabels, closeTestExecutionIssue, addTexecToTestplan, setExtendedAuth, setAuthentication } from './jiraClient.js';
import { isEmptyOrWhiteSpace } from './stringUtils.js';
import { accessSync, F_OK } from 'fs';

// ............................................................................
// METHODS,
// ............................................................................
/**
 * most @actions toolkit packages have async methods
 */
async function run() {
  try {
    // Input Parameters processing
    const path = getInput('path');
    const testPlanId = getInput('test-plan-id');
    const jiraUrl = getInput('jira-url');
    const jiraUser = getInput('jira-username');
    const jiraPass = getInput('jira-password');
    const jiraToken = getInput('jira-token');
    const xrayToken = getInput('xray-token');
    const cloudEnv = getInput('cloud-env');
    const description = getInput('description');
    const summary = getInput('summary');
    const assignee = getInput('assignee');
    const testEnvironments = getInput('testEnvironments');
    const affectedVersions = getInput('affected-versions');
    const labels = getInput('labels');
    const debug = getInput('debug');

    console.log("================================================================================");
    console.log(`path: ${path}`);
    console.log(`TestPlanId: ${testPlanId}`);
    console.log(`Jira Url: ${jiraUrl}`);
    console.log(`Jira Username: ${jiraUser}`);
    console.log(`Jira Password: ${jiraPass}`);
    console.log(`Cloud Env: ${cloudEnv}`);
    console.log(`Summary: ${summary}`);
    console.log(`Description: ${description}`);
    console.log(`Assignee: ${assignee}`);
    console.log(`Test Environments: ${testEnvironments}`);
    console.log(`Affected version/s: ${affectedVersions}`);
    console.log(`Labels: ${labels}`);
    console.log(`Debug: ${debug}`);
    console.log("================================================================================");

    // Check testplanId parameter
    if (isEmptyOrWhiteSpace(testPlanId)) {
      console.log(`Parameter TestPlanId validtion failed. Cannot be blank, null or whitespaced.`);
      throw `TestPlanId cannot be blank,null or whitespaced.`;
    }

    // Setup Jira Client
    setJiraUrl(jiraUrl);
    
    // Set headers for external or internal calls based on execution environment
    if (cloudEnv == 'true') {
    setExtendedAuth(jiraUser, jiraPass, jiraToken, xrayToken);
    } else { 
      setAuthentication(jiraUser, jiraPass); 
    }
   
    // Check specified path
    accessSync(path, F_OK); // it will throw an exception if no access

    // Verify Test plan
    let issueType = await getIssueType(testPlanId);
    if (issueType !== 'Test Plan') {
      throw `Wrong issue type (${issueType}) for ${testPlanId}`;
    }
    console.log(`Test plan found: ${testPlanId}`);

    // Import cucumber and determine type of report (Right now only supports cucumber)
    const reportKey = await importCucumberReport(path);
    if (!reportKey) {
      throw `Error importing report into jira`;
    }
    console.log(`Report imported on: ${reportKey}`);

    // Update some fields in test execution from actions parameters
    // Summary
    if (!isEmptyOrWhiteSpace(summary)) {
      var changeSummary = await changeIssueSummary(reportKey, summary);
      if (!changeSummary)
      {
        throw `Error changing summary to the Execution issue.`;
      }
      console.log(`Changed execution summary`)
    }

    // Update some fields in test execution from actions parameters
    // Summary
    if (!isEmptyOrWhiteSpace(description)) {
      var changeDescription = await changeIssueDescription(reportKey, description);
      if (!changeDescription)
      {
        throw `Error changing description to the Execution issue.`;
      }
      console.log(`Changed execution description`)
    }

    // Assignee (if defined)
    if (!isEmptyOrWhiteSpace(assignee)) {
      var changeAssignee = await changeIssueAssignee(reportKey, assignee);
      if (!changeAssignee)
      {
        throw `Error changing assignee to the Execution issue.`;
      }
      console.log(`Changed execution assignee`)
    }

    // JIRA Custom Field: Test Environments
    if (!isEmptyOrWhiteSpace(testEnvironments)) {
      var testEnvironmentsArray = testEnvironments.split(";");
      console.log(`Update Test Environments for ${reportKey} to ${testEnvironmentsArray}`)
      var changeTestEnvironments = await updateTestEnvironments(reportKey, testEnvironmentsArray);
      if (!changeTestEnvironments)
      {
        throw `Error changing test environments custom field to the execution issue.`;
      }
      console.log(`Changed test environments`)
    }

    // JIRA Custom Field: Affected version/s
    if (!isEmptyOrWhiteSpace(affectedVersions)) {
      var affectedVersionsArray = affectedVersions.split(";");
      console.log(`Update Affects versions for ${reportKey} to ${affectedVersionsArray}`)
      var changeAffectedVersions = await updateAffectedVersions(reportKey, affectedVersionsArray);
      if (!changeAffectedVersions)
      {
        throw `Error changing affected versions custom field to the execution issue.`;
      }
      console.log(`Changed affected versions`)
    }

    // JIRA Field: Labels
    if (!isEmptyOrWhiteSpace(labels)) {
      var labelsArray = labels.split(";");
      console.log(`Update labels for ${reportKey} to ${labelsArray}`)
      var changeLabels = await updateLabels(reportKey, labelsArray);
      if (!changeLabels)
      {
        throw `Error changing labels field to the execution issue.`;
      }
      console.log(`Changed labels`)
    }

    // Close test execution issue
    let closed = await closeTestExecutionIssue(reportKey);
    if (!closed) {
      throw `Error closing test execution ${reportKey}`;
    }
    console.log(`Test execution ${reportKey} closed`);

    // Add Testexecution to TestPlan
    let addedToTestPlan = await addTexecToTestplan(testPlanId, reportKey);
    if (!addedToTestPlan) {
        //Try one more time 
        addedToTestPlan = await addTexecToTestplan(testPlanId, reportKey);
        if (!addedToTestPlan) {
          //throw `Error adding test execution ${reportKey} to test plan ${testPlanId}`;
          console.log(`Error adding test execution ${reportKey} to test plan ${testPlanId}`);
        }
    }
    if (addedToTestPlan){
        console.log(`Test execution ${reportKey} added to test plan ${testPlanId}`);
    }

    // Set output...
    //const time = (new Date()).toTimeString();
    setOutput("report-key", reportKey);

  } catch (error) {
    setFailed(error.message);
  }
}

// ............................................................................
// Action Entrypoint
// ............................................................................
run();  // Just invoke our function