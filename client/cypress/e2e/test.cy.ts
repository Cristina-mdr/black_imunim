describe("radio group", () => {
  // beforeEach(() => {
  //     // Visit the page where the component is rendered
  //     cy.visit('/');
  //   });
  // beforeAll(() => {
  //   cy.visit('/'); // Ensure the server is running and the app is accessible
  // });
  beforeEach(()=>{
    cy.visit("/")
  })

  it("selects a radio button and clicks a button", () => {
    // 1. Find the radio input with value="option2" and check it
    cy.get('input[type="radio"][value="#377eb8"]').check();
    cy.get('input[type="radio"][value="#377eb8"]').should('be.checked');
    cy.get('input[type="radio"][value="#e41a1c"]').should('not.be.checked');

    cy.get('[data-testid="create-polygon-btn"]').click();

    //cy.get('input[type="RadioGroup"]');
    // cy.get('input[type="radio"][value="option2"]').check();

    // // 2. Verify radio button was checked
    // cy.get('input[type="radio"][value="option2"]').should('be.checked');

    // // 3. Click the button (replace the selector with your button's)
    //cy.get('[data-testid="create-polygon-btn"]').click();

    // // 4. Optionally, assert something after clicking the button
    // cy.url().should('include', '/some-success-page');
  });
});
