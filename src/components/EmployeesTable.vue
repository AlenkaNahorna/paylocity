<template>
  <v-data-table
    :headers="headers"
    :items="employees"
    item-key="id"
    :search="search"
    :sort-by="[{ key: 'name', order: 'asc' }]"
  >
    <template v-slot:top>
      <v-toolbar flat>
        <span class="ml-4 text-h6">Calculate Benefits</span>
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Search Employee"
          clearable
          max-width="200"
          color="primary"
          variant="underlined"
          hide-details
        ></v-text-field>
        <v-spacer></v-spacer>

        <v-dialog v-model="dialog" max-width="700px">
          <template v-slot:activator="{ props }">
            <v-btn class="mb-2" color="primary" dark v-bind="props"> New Employee </v-btn>
          </template>
          <v-card>
            <v-card-title>
              <span class="text-h5">{{ formTitle }}</span>
            </v-card-title>

            <v-card-text>
              <v-form ref="form">
                <v-container>
                  <v-row>
                    <v-col cols="12" md="4" sm="6">
                      <v-text-field
                        v-model="editedEmployee.name"
                        :rules="rules.name"
                        color="primary"
                        label="Name"
                        variant="outlined"
                        required
                      ></v-text-field>
                    </v-col>
                    <v-col
                      v-for="dependent in editedEmployee.dependents"
                      :key="dependent.id"
                      cols="12"
                      md="4"
                      sm="6"
                    >
                      <v-text-field
                        v-model="dependent.name"
                        :rules="rules.name"
                        color="primary"
                        label="Name of Dependent"
                        variant="outlined"
                        required
                      >
                        <v-btn
                          icon
                          position="absolute"
                          size="x-small"
                          variant="text"
                          :style="{ top: '-20px', right: '-20px', zIndex: 10 }"
                          @click="deleteDependentPerson(dependent)"
                        >
                          <v-icon color="primary" size="large">mdi-close</v-icon>
                        </v-btn>
                      </v-text-field>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-btn color="blue-darken-1" variant="text" @click="addDependentPerson()"
                      >Add Dependent Person</v-btn
                    >
                  </v-row>
                </v-container>
              </v-form>
            </v-card-text>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="blue-darken-1" variant="text" @click="close"> Cancel </v-btn>
              <v-btn color="blue-darken-1" variant="text" :disabled="!formIsValid" @click="save">
                Save
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <v-dialog v-model="dialogDelete" max-width="700px">
          <v-card>
            <v-card-title class="text-h5"
              >Are you sure you want to delete employee {{ editedEmployee.name }}?</v-card-title
            >
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="blue-darken-1" variant="text" @click="closeDelete">Cancel</v-btn>
              <v-btn color="blue-darken-1" variant="text" @click="deleteEmployeeConfirm">OK</v-btn>
              <v-spacer></v-spacer>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-toolbar>
    </template>

    <template #[`item.dependents`]="{ item }">
      <v-chip v-for="dependent in item.dependents" :key="dependent.id" class="me-2" label>
        {{ dependent.name }}
      </v-chip>
    </template>

    <template #[`item.benefitsForYear`]="{ item }">
      {{ calculateBenefitsForYear(item) }}
    </template>

    <template #[`item.benefitsForPaycheck`]="{ item }">
      {{ (calculateBenefitsForYear(item) / item.paychecksPerYear).toFixed(2) }}
    </template>

    <template #[`item.actions`]="{ item }">
      <v-icon class="me-2" color="primary" size="small" @click="handleEditEmployee(item)">
        mdi-pencil-outline
      </v-icon>
      <v-icon color="primary" size="small" @click="handleDeleteEmployee(item)">
        mdi-delete-outline
      </v-icon>
    </template>
    <template v-slot:no-data>
      <v-btn color="primary" @click="loadEmployees"> Reset </v-btn>
    </template>
  </v-data-table>
</template>

<script>
import { defaultEmployees } from '../utils/defaultEmployees.js'
import { generateRandomId } from '../utils/generateRandomId.js'

export default {
  data: () => ({
    employees: [],
    search: '',
    dialog: false,
    dialogDelete: false,
    headers: [
      { title: 'Employees', align: 'start', key: 'name' },
      { title: 'Dependents', key: 'dependents', sortable: false },
      { title: 'Discount (%)', key: 'discount' },
      { title: 'Benefits/year ($)', key: 'benefitsForYear', sortable: false },
      { title: 'Benefits/paycheck ($)', key: 'benefitsForPaycheck', sortable: false },
      { title: 'Actions', key: 'actions', sortable: false }
    ],
    editedIndex: -1,
    editedEmployee: {
      name: '',
      dependents: []
    },

    defaultEmployee: {
      name: '',
      dependents: []
    },

    rules: {
      name: [(v) => !!v || 'Name is required']
    }
  }),

  computed: {
    formTitle() {
      return this.editedIndex === -1 ? 'New Employee' : 'Edit Employee'
    },

    formIsValid() {
      return (
        this.editedEmployee.name.trim() !== '' &&
        this.editedEmployee.dependents.every((dependent) => dependent.name.trim() !== '')
      )
    }
  },

  watch: {
    dialog(val) {
      val || this.close()
    },
    dialogDelete(val) {
      val || this.closeDelete()
    }
  },

  mounted() {
    this.loadEmployees()
  },

  methods: {
    loadEmployees() {
      this.employees = localStorage.getItem('employees')
        ? JSON.parse(localStorage.getItem('employees'))
        : defaultEmployees
    },

    saveEmployees(employees) {
      localStorage.setItem('employees', JSON.stringify(employees))
    },

    calculateBenefitsForYear(employee) {
      let benefits = employee.benefits
      let discount = employee.discount
      let dependents = employee.dependents
      let totalBenefits = benefits

      dependents.forEach((dependent) => {
        totalBenefits += dependent.benefits
      })

      totalBenefits += totalBenefits * (discount / 100)
      return totalBenefits
    },

    handleEditEmployee(item) {
      this.editedIndex = this.employees.indexOf(item)
      this.editedEmployee = Object.assign({}, item)
      this.dialog = true
    },

    handleDeleteEmployee(item) {
      this.editedIndex = this.employees.indexOf(item)
      this.editedEmployee = Object.assign({}, item)
      this.dialogDelete = true
    },

    deleteEmployeeConfirm() {
      this.employees.splice(this.editedIndex, 1)
      this.saveEmployees(this.employees)
      this.closeDelete()
    },

    close() {
      this.dialog = false
      this.editedEmployee = Object.assign({}, this.defaultEmployee)
      this.editedIndex = -1
      this.loadEmployees()

      this.$refs?.form?.resetValidation()
    },

    closeDelete() {
      this.dialogDelete = false
      this.editedEmployee = Object.assign({}, this.defaultEmployee)
      this.editedIndex = -1
    },

    save() {
      if (this.editedIndex > -1) {
        this.updateDiscount()
        Object.assign(this.employees[this.editedIndex], this.editedEmployee)
        this.saveEmployees(this.employees)
      } else {
        this.editedEmployee.id = generateRandomId()
        this.editedEmployee.paychecksPerYear = 26
        this.editedEmployee.paycheck = 2000
        this.editedEmployee.benefits = 1000
        this.updateDiscount()
        this.employees.push(this.editedEmployee)

        this.saveEmployees(this.employees)
      }
      this.close()
    },

    addDependentPerson() {
      this.editedEmployee.dependents.push({
        id: generateRandomId(),
        name: '',
        benefits: 500
      })
    },

    deleteDependentPerson(dependent) {
      const index = this.editedEmployee.dependents.indexOf(dependent)
      this.editedEmployee.dependents.splice(index, 1)
    },

    updateDiscount() {
      const discountApplies =
        this.editedEmployee.name.toLowerCase().startsWith('a') ||
        this.editedEmployee.dependents.some((dep) => dep.name.toLowerCase().startsWith('a'))
      this.editedEmployee.discount = discountApplies ? 10 : 0
    }
  }
}
</script>
