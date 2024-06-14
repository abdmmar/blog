---
title: Organizing React Code
description: How I code in React
tag: Blog
keywords:
  - React
  - State Mangement
  - User Interface
status: Draft
publishedAt: "2024-06-14"
author: Abdullah Ammar
---

There's a lot of ways to handle states in React, either local or server state, 
from using React Context to share state and Reducer to manage state to use third party library like Redux or Jotai.
I feel using both approach can create maintainable code if we have the right mental model.
Usually when developing a features, there's data involved, both local and server. 
From here, we can determine which component that should manage the data and only show the data.
I often called it smart and dumb component. Dumb component should "only" handle data rendering and styling, where smart component handle the state management.
Handle server and local state management can have many approaches, it depends on what developer choose and prefer.
I usually choose React Query if the data served using REST API or Apollo if the data served using GraphQL.
Both library "simplify" the application codebase by providing cache management, parallel queries, devtools, and other stuff.
So we doesn't need to manually writing the abstractions that often ended up as a spaghetti code, no documentation, hard to extend, lack of features, and boilerplate-y code.

Great! server-state management simplified, how about local-state management? Using React Context + Provider might suit your preference and need, 
but using third party library that can handle state outside React is really helpful. 
But, the main problem is not the tool per se, if you doesn't know how to wire it together, your code could easily become mess, hard to read, refactor, and test, nightmare.
I don't mind if one file has 1000 LoC, if it's  organized well. 
Fortunately, React support this kind of approach, allowing developer to separate the mapper, constants value, component and data type, dumb and smart component, data-fetching hook, and local-state management in one file, close to each other :D.
Here's what I feel a decent code:

```ts
// 3rd part lib
import { Table } from '@shadcn/ui'
// common
import {validation} from '@utils/validation'
// local
import styles from './styles.module.scss'

const CONSTANT_VALUE = 'CONSTANT'

const useGetDataQuery = () => {}
const useCreateDataMutation = () => {}

const mapToOptions = (data: Data[]) => data.map(item => ({label: item.name, value: item.id}))

const useModal = () => useAtom(modalAtom)
const useItem = () => useAtom(itemAtom)
// ...

const columns = [
  {
    key: 'name',
    title: 'Name',
    render: (value) => <span>{value}</span>
  },
  {
    title: 'Action',
    render: (value) => {
      const open = useOpenModal()
      const setItem = useSetItem()

      return (
        <div>
          <a href="">View</a>
          <button onClick={() => {
            setItem(value)
            open('delete')
          }}>Delete</button>
        </div>
      )
    }
  }
]

const DeleteModal = () => {
  const form = useForm()
  const createMutation = useMutation()
  const [item] = useItem()

  const onSubmit = async (data) => {
    try {
      const result = await createMutation(data)
      toast.success('success')
    } catch (error) {
      toast.error(error)
    }
  }

  return (
    <Modal>
      <Form form={form} onSubmit={onSubmit}>
        <Input />
        <Button>Submit</Button>
      </Form>
    </Modal>
  )
}

const Page = () => {
  return (
    <div>
      <Table columns={columns} data={data} />
      <AddModal open={} />
      <DeleteModal open={} />
      <CreateModal open={} />
    </div>
  )
}
```

