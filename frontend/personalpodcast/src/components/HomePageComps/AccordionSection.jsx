import React from "react";

function AccordionSection() {
  return (
    <section className="my-5">
      <div className="container">
        <div className="row justify-content-center">

        <h2 className="mb-4 text-center text-main" style={{fontSize: "3em"}}>
          Frequently Asked Questions
        </h2>

          <div className="col-lg-8">

            <div className="accordion" id="faqAccordion">

              <div className="accordion-item background-light">
                <h2 className="accordion-header" id="headingOne">
                  <button
                    className="accordion-button background-light"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapseOne"
                  >
                    What are the basic features?
                  </button>
                </h2>
                <div
                  id="collapseOne"
                  className="accordion-collapse collapse show background-light"
                  data-bs-parent="#faqAccordion"
                >
                  <div className="accordion-body background-light">
                    Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  </div>
                </div>
              </div>

              <div className="accordion-item background-light">
                <h2 className="accordion-header" id="headingTwo">
                  <button
                    className="accordion-button collapsed background-light"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapseTwo"
                  >
                    How do I get started?
                  </button>
                </h2>
                <div
                  id="collapseTwo"
                  className="accordion-collapse collapse background-light"
                  data-bs-parent="#faqAccordion"
                >
                  <div className="accordion-body background-light">
                    Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  </div>
                </div>
              </div>

              <div className="accordion-item background-light">
                <h2 className="accordion-header" id="headingThree">
                  <button
                    className="accordion-button collapsed background-light"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapseThree"
                  >
                    What support options are available?
                  </button>
                </h2>
                <div
                  id="collapseThree"
                  className="accordion-collapse collapse background-light"
                  data-bs-parent="#faqAccordion"
                >
                  <div className="accordion-body background-light">
                    Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

export default AccordionSection;