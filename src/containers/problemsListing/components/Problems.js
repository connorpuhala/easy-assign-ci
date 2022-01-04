import React, { useState } from "react";
import {
  Grid,
  Image,
  Segment,
  Button,
  Dropdown,
  Confirm,
} from "semantic-ui-react";
import { connect } from "react-redux";
import { getEasyAssignUser, getImageWidthHeight } from "utils/utilities";
import { LoaderWithinWrapper } from "components/global/loader";
import CreateProblemModal from "components/createProblemModal";
import {
  createProblem,
  createNewTag,
  editProblem,
} from "redux/actions/problems";
import { bindActionCreators } from "redux";
import createNotification from "components/global/createNotification";
import { jsPDF } from "jspdf";

const Problems = ({
  user,
  isGetProblemsByTags,
  problems,
  problemsCount,
  isGetProblemsByTagsError,
  isGetProblemsByTagsErrorMsg,
  createProblem,
  createNewTag,
  editProblem,
}) => {
  const [isCreateProblemModal, setIsCreateProblemModal] = useState({
    isOpen: false,
    mode: "",
  });
  const [selectedProblem, setSelectedProblem] = useState(null);

  const createProblemModalHandler = (val) => {
    console.log("setIsCreateProblemModal val", val);
    if (val.isOpen === false) {
      setSelectedProblem(null);
      setIsCreateProblemModal({ isOpen: false, mode: "" });
    }
    if (val.isOpen) {
      if (val.mode === "Edit") {
        setSelectedProblem(val.problem);
      } else {
        setSelectedProblem(null);
      }
      setIsCreateProblemModal({ isOpen: val.isOpen, mode: val.mode });
    }
  };

  const deleteProblem = () => {
    console.log("deleteProblem");
  };

  const createProblemHandler = ({ data, mode, newTag }) => {
    console.log("data ===", data);
    if (mode === "Create") {
      if (newTag !== "") {
        let body = {
          label: newTag,
        };
        createNewTag(body).then((action) => {
          console.log("action ====", action);
          if (action.type === "CREATE_TAG_SUCCESS") {
            let body = {
              ...data,
              image: data.image.split(",")[1],
              tagIDs: [...data.tagIDs, action.payload[0].id],
            };
            createProblem(body).then((action) => {
              if (action.type === "CREATE_PROBLEM_SUCCESS") {
                setIsCreateProblemModal({ isOpen: false, mode: "" });
                createNotification({
                  type: "success",
                  title: "Uploaded",
                  msg: "Problem uploaded successfully.",
                  // timeout: 6000,
                });
              } else {
                createNotification({
                  type: "danger",
                  title: "Something went wrong!",
                  msg: "Please try again.",
                  timeout: 6000,
                });
              }
            });
          }
        });
      } else {
        let body = {
          ...data,
          image: data.image.split(",")[1],
        };
        createProblem(body).then((action) => {
          if (action.type === "CREATE_PROBLEM_SUCCESS") {
            setIsCreateProblemModal({ isOpen: false, mode: "" });
            createNotification({
              type: "success",
              title: "Uploaded",
              msg: "Problem uploaded successfully.",
              // timeout: 6000,
            });
          } else {
            createNotification({
              type: "danger",
              title: "Something went wrong!",
              msg: "Please try again.",
              timeout: 6000,
            });
          }
        });
      }
    } else {
      // alert("edit is in progress...");
      let body = {
        ...data,
        // image: data.image.split(",")[1],
      };
      editProblem(body, data.id);
    }
  };
  const createNewTagHandler = (newTag) => {
    let body = {
      label: newTag,
    };
    createNewTag(body);
  };

  const downloadProblemsPdfHandler = async () => {
    console.log("@downloadProblemsPdfHandler");
    let pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const sectionWidth = pageWidth;
    const sectionHeight = Math.floor(pageHeight / 4);
    const pageRatio = pageWidth / pageHeight;
    const sectionRatio = sectionWidth / sectionHeight;
    let imgCounter = 0;
    const length = problems.length;
    let x1 = 0;
    let y1 = 0;
    console.log("pageWidth ====", pageWidth, "pageHeight", pageHeight);
    console.log("pageRatio ====", pageRatio, "sectionRatio", sectionRatio);
    if (length === 1) {
      let { imgWidth, imgHeight } = getImageWidthHeight({
        url: problems[0].image_url,
      });
      let scale = Math.min(sectionWidth / imgWidth, sectionHeight / imgHeight);
      let sw1 = imgWidth * scale;
      let sh1 = imgHeight * scale;
      let x = (sectionWidth - sw1) / 2;
      let y = (sectionHeight - sh1) / 2;
      pdf.addImage(problems[0].image_url, "JPEG", x, y, sw1, sh1, null, "NONE");
      pdf.save("pdfName");
    } else {
      for (let i = 0; i < length; i++) {
        let { imgWidth, imgHeight } = getImageWidthHeight({
          url: problems[i].image_url,
        });
        let scale = Math.min(
          sectionWidth / imgWidth,
          sectionHeight / imgHeight
        );
        let sw1 = imgWidth * scale;
        let sh1 = imgHeight * scale;
        let x = (sectionWidth - sw1) / 2;
        let y = (sectionHeight - sh1) / 2 * imgCounter;
        console.log("xxxxxx", x, "yyyyyyy", y);
        // if(i === 0){}
        pdf.addImage(
          problems[i].image_url,
          "JPEG",
          x,
          y,
          sw1,
          sh1,
          null,
          `$prob_${i}`
        );
        imgCounter = imgCounter + 1;
        if (imgCounter === 3) {
          pdf.addPage();
          imgCounter = 0;
        }
        if (i + 1 === problems.length) {
          pdf.save("pdfName");
        }
      }
    }
  };
  return (
    <>
      <Grid.Row columns={3}>
        {user.userRole === "admin" ? (
          <Button
            primary
            onClick={() =>
              createProblemModalHandler({
                isOpen: true,
                mode: "Create",
              })
            }
          >
            Create Problem
          </Button>
        ) : null}
        <Button
          secondary
          disabled={!problems.length}
          onClick={() => downloadProblemsPdfHandler()}
        >
          Download
        </Button>
      </Grid.Row>
      <Grid.Row columns={3}>
        {isGetProblemsByTags ? <LoaderWithinWrapper /> : null}
        <div>
          {problems.length
            ? problems.map((problem, index) => {
                return (
                  <ProblemItem
                    key={problem.id}
                    problem={problem}
                    user={user}
                    createProblemModalHandler={createProblemModalHandler}
                    deleteProblem={deleteProblem}
                  />
                );
              })
            : "No problems found. select different tags"}
        </div>
        {isCreateProblemModal.isOpen ? (
          <CreateProblemModal
            isCreateProblemModal={isCreateProblemModal}
            onClose={setIsCreateProblemModal}
            selectedProblem={selectedProblem}
            createProblem={createProblemHandler}
            createNewTag={createNewTagHandler}
          />
        ) : null}
      </Grid.Row>
    </>
  );
};

const mapStateToProps = (state) => {
  let {
    isGetProblemsByTags,
    problems,
    problemsCount,
    isGetProblemsByTagsError,
    isGetProblemsByTagsErrorMsg,
  } = state.problems;
  return {
    user: getEasyAssignUser(),
    isGetProblemsByTags,
    problems,
    problemsCount,
    isGetProblemsByTagsError,
    isGetProblemsByTagsErrorMsg,
  };
};

const mapDispatch = (dispatch) =>
  bindActionCreators({ createProblem, createNewTag, editProblem }, dispatch);

export default connect(mapStateToProps, mapDispatch)(Problems);

export const ProblemItem = ({
  problem,
  user,
  createProblemModalHandler,
  deleteProblem,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmBox, setIsConfirmBox] = useState(false);

  const onConfirmBoxDelete = (v) => {
    deleteProblem();
    setIsConfirmBox(false);
  };

  const onConfirmBoxCancel = (v, d) => {
    setIsConfirmBox(false);
  };

  return (
    <Segment raised vertical padded color="olive" style={{ margin: "10px" }}>
      id: {problem.id}
      <br />
      answer: {problem.answer}
      {isLoading ? <LoaderWithinWrapper /> : null}
      <Image
        src={problem.image_url}
        size="large"
        centered
        alt="problem_img"
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
      />
      {user.userRole === "admin" ? (
        <Dropdown text="Edit">
          <Dropdown.Menu>
            <Dropdown.Item
              onClick={() => {
                createProblemModalHandler({
                  isOpen: true,
                  mode: "Edit",
                  problem,
                });
              }}
            >
              Edit
            </Dropdown.Item>
            <Dropdown.Item
              onClick={() => {
                setIsConfirmBox(true);
              }}
            >
              Delete
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      ) : null}
      <Confirm
        open={isConfirmBox}
        onCancel={onConfirmBoxCancel}
        onConfirm={() => onConfirmBoxDelete(problem.id)}
      />
    </Segment>
  );
};

export const getImageHeightWidth = (url) => {
  console.log("url ====", url);
  return new Promise((resolve, reject) => {
    // let img = new Image();
    // let img = new Image(200,200);
    // img.crossOrigin = "anonymous";
    const img = document.createElement("img");
    // img.width = 200
    // img.height =300
    img.src = url;
    img.onload = () => {
      console.log("in onload----");
      const { naturalWidth, naturalHeight } = img;
      // console.log("img ===width", img.width, "height", img.height);
      console.log("nnnnnnnnnnnnnnnn", naturalWidth, naturalHeight);
      resolve({ width: naturalWidth, height: naturalHeight });
    };
    img.onerror = function (error) {
      //display error
      console.log("error ===", error);
      resolve({ width: 0, height: 0 });
      // document.body.appendChild(
      //     document.createTextNode('\nError loading as image: ' + this.src)
      // );
    };
  });
};
