import * as mm from '../../';

class Employee extends mm.Table {
  id = mm.pk(mm.int()).setDBName('emp_no').noAutoIncrement;
  firstName = mm.varChar(50);
  lastName = mm.varChar(50);
  gender = mm.varChar(10);
  birthDate = mm.date();
  hireDate = mm.date();
}

export default mm.table(Employee, 'employees');
