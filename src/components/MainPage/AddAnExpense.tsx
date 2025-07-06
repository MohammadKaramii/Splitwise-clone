import { useState, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, useGroups, useExpenses } from "../../hooks";
import { validateAmount, validateExpenseDescription } from "../../utils";
import { Loading } from "../Loading";
import { Button } from "../common";
import toast from "react-hot-toast";

interface FormData {
  description: string;
  cost: string;
  errors: Record<string, string>;
  isErrors: boolean;
}

export const AddAnExpense = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { groups } = useGroups();
  const { createExpense } = useExpenses();

  const [formData, setFormData] = useState<FormData>({
    description: "",
    cost: "",
    errors: {},
    isErrors: false,
  });

  const [whoPaid, setWhoPaid] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGroupForExpense, setSelectedGroupForExpense] = useState("");

  const activeGroup = user?.activeGroup;
  const activeFriend = user?.activeFriend;

  const availableGroups = useMemo(() => {
    if (activeFriend) {
      return groups.filter((group) => group.friends.includes(activeFriend));
    }
    return groups;
  }, [groups, activeFriend]);

  const groupMembers = useMemo(() => {
    const groupName = activeGroup || selectedGroupForExpense;
    const group = groups.find((g) => g.groupName === groupName);

    if (!group || !user?.name) return [];

    const members = [...group.friends];
    if (!members.includes(user.name)) {
      members.push(user.name);
    }
    return members;
  }, [groups, activeGroup, selectedGroupForExpense, user?.name]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!user?.id) return;

      setIsLoading(true);
      const errors: Record<string, string> = {};

      const descError = validateExpenseDescription(formData.description);
      if (descError) errors.description = descError;

      const costError = validateAmount(formData.cost);
      if (costError) errors.cost = costError;

      if (!activeGroup && !selectedGroupForExpense) {
        errors.group = "You must select a group for this expense";
      }

      if (!whoPaid) {
        errors.whoPaid = "You must select a payer";
      }

      if (selectedFriends.length === 0) {
        errors.sharedWith = "Please choose who shares the expense";
      }

      if (selectedFriends.length === 1 && selectedFriends.includes(whoPaid)) {
        errors.sharedWith = "You cannot share an expense only with the payer";
      }

      if (Object.keys(errors).length > 0) {
        setFormData({ ...formData, errors, isErrors: true });
        setIsLoading(false);
        return;
      }

      const targetGroup = groups.find(
        (g) => g.groupName === (activeGroup || selectedGroupForExpense)
      );
      if (!targetGroup) {
        toast.error("Group not found");
        setIsLoading(false);
        return;
      }

      const result = await createExpense({
        description: formData.description,
        amount: parseFloat(formData.cost),
        paidBy: whoPaid,
        sharedWith: selectedFriends,
        groupId: targetGroup.id,
      });

      if (result?.success) {
        navigate("/mainpage");
        setFormData({ description: "", cost: "", errors: {}, isErrors: false });
        setWhoPaid("");
        setSelectedFriends([]);
        setSelectedGroupForExpense("");
      }

      setIsLoading(false);
    },
    [
      formData,
      whoPaid,
      selectedFriends,
      activeGroup,
      selectedGroupForExpense,
      groups,
      user,
      createExpense,
      navigate,
    ]
  );

  if (isLoading) return <Loading />;

  return (
    <div className="container py-lg">
      <div className="flex justify-center">
        <div className="flex gap-lg">
          <div>
            <img
              src="https://assets.splitwise.com/assets/core/logo-square-65a6124237868b1d2ce2f5db2ab0b7c777e2348b797626816400534116ae22d7.svg"
              className="img-fluid"
              alt="Splitwise logo"
            />
          </div>
          <div className="form-container">
            {formData.isErrors && (
              <div className="error_messages mb-md">
                <span className="text-error font-semibold">
                  The following errors occurred:
                </span>
                <ul className="mt-sm">
                  {Object.entries(formData.errors).map(([field, message]) => (
                    <li key={field} className="text-error">
                      {message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {!activeGroup && (
                <div className="mb-md">
                  <label className="form-label text-secondary">
                    Choose a group for this expense
                  </label>
                  <select
                    className="form-control form-control-lg"
                    value={selectedGroupForExpense}
                    onChange={(e) => setSelectedGroupForExpense(e.target.value)}
                  >
                    <option value="">Select a group...</option>
                    {availableGroups.map((group) => (
                      <option key={group.id} value={group.groupName}>
                        {group.groupName}
                      </option>
                    ))}
                  </select>
                  {availableGroups.length === 0 && (
                    <div className="mt-sm">
                      <p className="text-muted">No groups available.</p>
                      <Link to="/groups/new">
                        <Button size="small">Create a new group</Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <div className="mb-md">
                <label
                  className="form-label text-secondary"
                  htmlFor="description"
                >
                  Enter a description
                </label>
                <input
                  type="text"
                  id="description"
                  className="form-control form-control-lg"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              {formData.description && (
                <>
                  <div className="mb-md">
                    <label className="form-label text-secondary" htmlFor="cost">
                      Enter Amount
                    </label>
                    <input
                      type="text"
                      id="cost"
                      className="form-control"
                      placeholder="$0.00"
                      value={formData.cost}
                      onChange={(e) =>
                        setFormData({ ...formData, cost: e.target.value })
                      }
                    />
                  </div>

                  <div className="mb-md">
                    <label className="form-label">Choose who paid:</label>
                    <ul className="list-group">
                      {groupMembers.map((member) => (
                        <li
                          key={member}
                          onClick={() => setWhoPaid(member)}
                          className={`list-group-item my-1 cursor-pointer ${
                            whoPaid === member ? "active" : ""
                          }`}
                        >
                          {member} {member === user?.name && "(You)"}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-md">
                    <label className="form-label">
                      Choose who will share the expense:
                    </label>
                    <ul className="list-group">
                      {groupMembers.map((member) => (
                        <li
                          key={member}
                          onClick={() => {
                            if (selectedFriends.includes(member)) {
                              setSelectedFriends(
                                selectedFriends.filter((f) => f !== member)
                              );
                            } else {
                              setSelectedFriends([...selectedFriends, member]);
                            }
                          }}
                          className={`list-group-item my-1 cursor-pointer ${
                            selectedFriends.includes(member) ? "active" : ""
                          }`}
                        >
                          {member} {member === user?.name && "(You)"}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-center">
                    <Button
                      type="submit"
                      loading={isLoading}
                      disabled={isLoading}
                    >
                      Add Expense
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
