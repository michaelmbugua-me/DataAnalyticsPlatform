import {ComponentFixture, TestBed} from '@angular/core/testing';
import {GroupedTableComponentComponent} from './grouped-table-component.component';

describe('GroupedTableComponentComponent', () => {

  let component: GroupedTableComponentComponent;
  let fixture: ComponentFixture<GroupedTableComponentComponent>;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      declarations: [], imports: [GroupedTableComponentComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(GroupedTableComponentComponent);
    component = fixture.componentInstance;

  });

  afterEach(() => {
    jest.clearAllMocks();
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
