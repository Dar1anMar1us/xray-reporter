# XRay Reporter

> Reports tests results to JIRA/XRay Test Plan

**IMPORTANT**: Currently it only supports cucumber.json reports.

## [Inputs](#inputs)

- [path](#path)
- [test-plan-id](#test-plan-id)
- [jira-url](#jira-url)
- [jira-username](#jira-username)
- [jira-password](#jira-password)
- [summary](#summary)
- [description](#description)
- [testEnvironments](#testenvironments)
- [affected-versions](#affected-versions)
- [labels](#labels)
- [assignee](#assignee)
- [debug](#debug)

## [Outputs](#outputs)

- [report-key](#report-key)

## [Examples usage](#examples)

<h2 style="font-weight: bold" id="inputs">Inputs</h2>

<h3 style="font-weight: bold" id="path">path</h3>

**Required** Path to cucumber.json result file.

<h3 style="font-weight: bold" id="test-plan-id">test-plan-id</h3>

**Required** Test plan identifier in JIRA/XRay. Example: COTECCAREN-0000

<h3 style="font-weight: bold" id="jira-url">jira-url</h3>

Jira installation url.

<h3 style="font-weight: bold" id="jira-username">jira-username</h3>

**Required** Jira user. Note: since this user will be the one doing the operations through the API calls, it will be the user Assigned and marked as the one who created the artifacts in JIRA.

<h3 style="font-weight: bold" id="jira-password">jira-password</h3>

**Required** Jira user password/token.

<h3 style="font-weight: bold" id="summary">summary</h3>

**OPTIONAL** Summary to set into the test summary jira issue.

<h3 style="font-weight: bold" id="description">description</h3>

**OPTIONAL** Description to set into the test execution jira issue.

<h3 style="font-weight: bold" id="testEnvironments">testEnvironments</h3>

**OPTIONAL** A string containing a list of test environments separated by ';'. It will be set as Test Environments field.

<h3 style="font-weight: bold" id="assignee">assignee</h3>

**OPTIONAL**Specify Jira User Id to set as assignee to the execution. Otherwise, the default user who do the JIRA Api call will be used.

<h3 style="font-weight: bold" id="affected-versions">affected-versions</h3>

**OPTIONAL** A string containing a list of affected versions separated by ';'. It will be set as Affects Version/s field.

<h3 style="font-weight: bold" id="labels">labels</h3>

**OPTIONAL** A string containing a list of labels separated by ';'. It will be set as Labels field.

<h3 style="font-weight: bold" id="debug">debug</h3>

**OPTIONAL** Specify debug mode. It adds more output. Take care, it can publish sensitive invormation if it's not properly cypher in your env variables. `Default false`

<h2 style="font-weight: bold" id="outputs">Outputs</h2>

<h3 style="font-weight: bold" id="report-key">report-key</h3>

Created report key. Example: COTECCAREN-0000

<h2 style="font-weight: bold" id="examples">Examples usage</h2>

```yaml
- name: Publish cucumber execution result
  id: publish-cucumber-result
  uses: ./.github/actions/testing/xray-reporter
  with:
    path: ${{ github.workspace }}/path/to/cucumber.json
    test-plan-id: ATESTPLANID
    jira-username: ${{ secrets.SRVC_E2ETEST_USERNAME }}
    jira-password: ${{ secrets.SRVC_E2ETEST_PASSWORD }}
    description: "An optional description"
    testEnvironments: "DEV;QA"
```

## Developer

### Build

```shell
npm run prepare
```
it will update everything under dist folder where the "real" action will be.

### Publish

After `prepare` makes sure that you commit `dist` folder changes as part of your commits. Then, just push to the repo.
