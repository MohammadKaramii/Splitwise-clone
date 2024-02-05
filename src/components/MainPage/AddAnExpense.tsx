import { useState } from "react";
import validator from "validator";
import { useDispatch, useSelector } from "react-redux";
import { updateMessage } from "../../redux/reducers/dummyDataSlice";
import { RootState } from "../../redux/store";
import { supabase } from "../../../supabase";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { uid } from "uid";
interface Errors {
  description?: string;
  cost?: string;
}

interface FormData {
  description?: string;
  cost?: string;
  errors: Errors;
  isErrors: boolean;
}

const AddAnExpense = () => {
  const activeGroup = useSelector(
    (state: RootState) => state.userData.user.activeGroup
  );
  const groups = useSelector((state: RootState) => state.dummyData.groups);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    description: "",
    cost: "",
    errors: {},
    isErrors: false,
  });

  const { description, cost, errors, isErrors } = formData;
  const [isActive, setIsActive] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.id]: event.target.value });
    setIsActive(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (description === "" || description?.trim() === "") {
      errors.description = "Description name can't be blank";
    }

    if (cost === "" || cost?.trim() === "" || !validator.isNumeric(cost!)) {
      errors.cost = "Cost must be a number";
    }

    const newHowSpent = {
      message: description!,
      cost: Number(cost),
      createdAt: new Date().toISOString(),
      id: uid(),
    };

    
    
    if (Object.keys(errors).length === 0) {
      const updatedGroups = groups.map((group) => {
        if (group.groupName === activeGroup) {
          const updatedGroup = { ...group };

          updatedGroup.howSpent = updatedGroup.howSpent
            ? [newHowSpent, ...updatedGroup.howSpent]
            : [newHowSpent];

          return updatedGroup;
        }

        return group;
      });

      const indexCurrentGroup = updatedGroups.findIndex(item => item.groupName === activeGroup)
    
      
      const { error } = await supabase
      .from("groups")
      .update({ howSpent: updatedGroups[indexCurrentGroup].howSpent })
      .eq("groupName", activeGroup);
      
      if (error) {
        toast.error(`Error updating data: ${error}`);
      } else {
        toast.success("Data updated successfully!", {
          duration: 4000,
        });
        navigate("/mainpage");
      }
      
      dispatch(updateMessage(updatedGroups));
      
      setFormData({
        ...formData,
        description: "",
        cost: "",
        errors: {},
        isErrors: false,
      });
      
      return;
    } else {
      setFormData({
        ...formData,
        errors,
        isErrors: true,
      });

      return;
    }
  };
  return (
    <>
      <div className="toppad"></div>
      <div className="container">
        <div className="d-flex justify-content-center gap-md-5">
          <div className="d-flex justify-content-center gap-md-5">
            <div className="col-md-2 signup-left-logo">
              <img
                src="https://assets.splitwise.com/assets/core/logo-square-65a6124237868b1d2ce2f5db2ab0b7c777e2348b797626816400534116ae22d7.svg"
                className="img-fluid"
                alt="Sample image"
              />
            </div>
            <div className="form-container">
              {isErrors && (
                <div className="error_messages">
                  <span className="error">The following errors occurred:</span>
                  <div id="errorExplanation">
                    <ul>
                      {errors.description && <li>{errors.description}</li>}
                      {errors.cost && <li>{errors.cost}</li>}
                    </ul>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-outline mb-3">
                  <label
                    className="form-label text-secondary"
                    htmlFor="description"
                  >
                    Enter a description
                  </label>
                  <input
                    type="text"
                    id="description"
                    className="form-control form-control-lg name-input"
                    value={description}
                    onChange={handleChange}
                  />
                </div>
                {isActive && (
                  <>
                    <div className="form-group mb-3 bottom-inputs">
                      <label className="form-label" htmlFor="cost">
                        <strong className="text-secondary">Enter Amount</strong>
                        :
                      </label>
                      <div className="price-input">
                        <input
                          type="text"
                          id="cost"
                          className="form-control name-input"
                          placeholder="$0.00"
                          value={cost}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="bottom-btns">
                      <div className="signup-btn Add-btn">
                        <button type="submit">Add</button>
                      </div>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddAnExpense;
